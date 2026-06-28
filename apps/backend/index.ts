import express from "express";
import cors from "cors";
import { middleware } from "./middleware";
import { prisma } from "db";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());
app.use(cors());

// Helper to safely parse orderbook
interface LimitOrder {
  id: string;
  userId: string;
  price: number; // in cents (1 - 99)
  qty: number;
  side: "buy" | "sell";
}

interface OrderBook {
  bids: LimitOrder[]; // Sorted descending by price
  asks: LimitOrder[]; // Sorted ascending by price
}

function parseOrderBook(json: any): OrderBook {
  if (!json || typeof json !== "object") {
    return { bids: [], asks: [] };
  }
  return {
    bids: Array.isArray(json.bids) ? json.bids : [],
    asks: Array.isArray(json.asks) ? json.asks : [],
  };
}

// GET Balance
app.get("/balance", middleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { usdBalance: true },
    });
    res.json({ balance: user?.usdBalance ?? 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET Positions
app.get("/position", middleware, async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      where: { userId: req.userId },
      include: { market: true },
    });
    res.json(positions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET Order History
app.get("/history", middleware, async (req, res) => {
  try {
    const history = await prisma.orderHistory.findMany({
      where: { userId: req.userId },
      include: { market: true },
    });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Split: Convert $1.00 into 1 Yes share and 1 No share
app.post("/split", middleware, async (req, res) => {
  const { marketId, qty } = req.body;
  if (!marketId || typeof qty !== "number" || qty <= 0) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  const cost = qty * 100; // 100 cents per split pair

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: req.userId } });
      if (!user || user.usdBalance < cost) {
        throw new Error("Insufficient USD balance to perform split");
      }

      const market = await tx.market.findUnique({ where: { id: marketId } });
      if (!market) {
        throw new Error("Market not found");
      }

      // Deduct USD balance
      await tx.user.update({
        where: { id: req.userId },
        data: { usdBalance: { decrement: cost } },
      });

      // Credit positions
      const updatePosition = async (type: "Yes" | "No") => {
        const pos = await tx.position.findUnique({
          where: { userId_marketId_type: { userId: req.userId!, marketId, type } },
        });
        if (pos) {
          await tx.position.update({
            where: { id: pos.id },
            data: { qty: { increment: qty } },
          });
        } else {
          await tx.position.create({
            data: { userId: req.userId!, marketId, type, qty },
          });
        }
      };

      await updatePosition("Yes");
      await updatePosition("No");

      // Increment market volume
      await tx.market.update({
        where: { id: marketId },
        data: { totalQty: { increment: qty } },
      });

      // Log Order History
      await tx.orderHistory.create({
        data: {
          orderType: "Split",
          qty,
          price: 100,
          userId: req.userId!,
          marketId,
        },
      });

      return { balance: user.usdBalance - cost };
    });

    res.json({ message: "Split successful", ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST Merge: Convert 1 Yes share and 1 No share into $1.00
app.post("/merge", middleware, async (req, res) => {
  const { marketId, qty } = req.body;
  if (!marketId || typeof qty !== "number" || qty <= 0) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  const payout = qty * 100;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const yesPos = await tx.position.findUnique({
        where: { userId_marketId_type: { userId: req.userId!, marketId, type: "Yes" } },
      });
      const noPos = await tx.position.findUnique({
        where: { userId_marketId_type: { userId: req.userId!, marketId, type: "No" } },
      });

      if (!yesPos || yesPos.qty < qty || !noPos || noPos.qty < qty) {
        throw new Error("Insufficient Yes or No positions to merge");
      }

      // Decrement positions
      await tx.position.update({
        where: { id: yesPos.id },
        data: { qty: { decrement: qty } },
      });

      await tx.position.update({
        where: { id: noPos.id },
        data: { qty: { decrement: qty } },
      });

      // Credit USD balance
      const updatedUser = await tx.user.update({
        where: { id: req.userId },
        data: { usdBalance: { increment: payout } },
      });

      // Decrement market volume
      await tx.market.update({
        where: { id: marketId },
        data: { totalQty: { decrement: qty } },
      });

      // Log Order History
      await tx.orderHistory.create({
        data: {
          orderType: "Merge",
          qty,
          price: 100,
          userId: req.userId!,
          marketId,
        },
      });

      return { balance: updatedUser.usdBalance };
    });

    res.json({ message: "Merge successful", ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST Buy: Buy contracts (Yes or No)
app.post("/buy", middleware, async (req, res) => {
  const { marketId, type, price, qty } = req.body; // type is "Yes" or "No", price in cents
  if (!marketId || (type !== "Yes" && type !== "No") || typeof price !== "number" || typeof qty !== "number" || qty <= 0 || price <= 0 || price >= 100) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: req.userId } });
      if (!user) throw new Error("User not found");

      const cost = price * qty;
      if (user.usdBalance < cost) {
        throw new Error("Insufficient USD balance");
      }

      const market = await tx.market.findUnique({ where: { id: marketId } });
      if (!market) throw new Error("Market not found");

      // Parse orderbooks
      const yesBook = parseOrderBook(market.yesOrderbook);
      const noBook = parseOrderBook(market.noOrderbook);

      let remainingQty = qty;
      let cashDeducted = 0;

      // 1. Direct matching: Look for resting sell orders (asks) of the same type at or below requested price
      const sameBook = type === "Yes" ? yesBook : noBook;
      const oppositeBook = type === "Yes" ? noBook : yesBook;

      sameBook.asks.sort((a, b) => a.price - b.price); // Cheapest first
      const newAsks: LimitOrder[] = [];

      for (const ask of sameBook.asks) {
        if (remainingQty > 0 && ask.price <= price) {
          const matchQty = Math.min(remainingQty, ask.qty);
          const matchCost = matchQty * ask.price;

          // Deduct from buyer, credit to seller
          cashDeducted += matchCost;
          await tx.user.update({
            where: { id: ask.userId },
            data: { usdBalance: { increment: matchCost } },
          });

          // Update seller's position (decrement)
          const sellerPos = await tx.position.findUnique({
            where: { userId_marketId_type: { userId: ask.userId, marketId, type } },
          });
          if (sellerPos) {
            await tx.position.update({
              where: { id: sellerPos.id },
              data: { qty: { decrement: matchQty } },
            });
          }

          // Update buyer's position (increment)
          const buyerPos = await tx.position.findUnique({
            where: { userId_marketId_type: { userId: req.userId!, marketId, type } },
          });
          if (buyerPos) {
            await tx.position.update({
              where: { id: buyerPos.id },
              data: { qty: { increment: matchQty } },
            });
          } else {
            await tx.position.create({
              data: { userId: req.userId!, marketId, type, qty: matchQty },
            });
          }

          // Log Order History
          await tx.orderHistory.create({
            data: { orderType: "Buy", type: type as any, qty: matchQty, price: ask.price, userId: req.userId!, marketId },
          });
          await tx.orderHistory.create({
            data: { orderType: "Sell", type: type as any, qty: matchQty, price: ask.price, userId: ask.userId, marketId },
          });

          remainingQty -= matchQty;
          ask.qty -= matchQty;

          if (ask.qty > 0) {
            newAsks.push(ask);
          }
        } else {
          newAsks.push(ask);
        }
      }
      sameBook.asks = newAsks;

      // 2. Cross-matching (minting): Match buy Yes @ P with buy No @ 100-P
      const targetOppositePrice = 100 - price;
      // We look for bids in oppositeBook with price >= targetOppositePrice
      oppositeBook.bids.sort((a, b) => b.price - a.price); // Highest first
      const newOppositeBids: LimitOrder[] = [];

      for (const bid of oppositeBook.bids) {
        if (remainingQty > 0 && bid.price >= targetOppositePrice) {
          const matchQty = Math.min(remainingQty, bid.qty);
          
          // Combined price is bid.price + our price (which is >= 100).
          // We split the cost: user pays `price * matchQty`, opposite bidder pays `bid.price * matchQty`
          const userCost = price * matchQty;
          const bidderCost = bid.price * matchQty;

          cashDeducted += userCost;

          // Deduct from opposite bidder
          await tx.user.update({
            where: { id: bid.userId },
            data: { usdBalance: { decrement: bidderCost } },
          });

          // Mint new positions: Give matching type to buyer, opposite type to bidder
          const addPos = async (uId: string, pType: "Yes" | "No", q: number) => {
            const pos = await tx.position.findUnique({
              where: { userId_marketId_type: { userId: uId, marketId, type: pType } },
            });
            if (pos) {
              await tx.position.update({ where: { id: pos.id }, data: { qty: { increment: q } } });
            } else {
              await tx.position.create({ data: { userId: uId, marketId, type: pType, qty: q } });
            }
          };

          await addPos(req.userId!, type, matchQty);
          await addPos(bid.userId, type === "Yes" ? "No" : "Yes", matchQty);

          // Log Order History
          await tx.orderHistory.create({
            data: { orderType: "Buy", type: type as any, qty: matchQty, price, userId: req.userId!, marketId },
          });
          await tx.orderHistory.create({
            data: { orderType: "Buy", type: (type === "Yes" ? "No" : "Yes") as any, qty: matchQty, price: bid.price, userId: bid.userId, marketId },
          });

          remainingQty -= matchQty;
          bid.qty -= matchQty;

          if (bid.qty > 0) {
            newOppositeBids.push(bid);
          }
        } else {
          newOppositeBids.push(bid);
        }
      }
      oppositeBook.bids = newOppositeBids;

      // 3. If there is still remaining qty, place a resting Limit Order (bid)
      if (remainingQty > 0) {
        const orderId = uuidv4();
        sameBook.bids.push({
          id: orderId,
          userId: req.userId!,
          price,
          qty: remainingQty,
          side: "buy",
        });
        // Sort bids descending
        sameBook.bids.sort((a, b) => b.price - a.price);

        // Deduct the cash for the resting limit order now to reserve it
        cashDeducted += remainingQty * price;
      }

      // Apply total cash deduction to buyer
      await tx.user.update({
        where: { id: req.userId },
        data: { usdBalance: { decrement: cashDeducted } },
      });

      const matchedQty = qty - remainingQty;

      // Save updated orderbooks and volume
      await tx.market.update({
        where: { id: marketId },
        data: {
          yesOrderbook: yesBook as any,
          noOrderbook: noBook as any,
          totalQty: { increment: matchedQty },
        },
      });

      return { remainingQty };
    });

    res.json({ message: "Buy order processed successfully", ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST Sell: Sell contracts (Yes or No)
app.post("/sell", middleware, async (req, res) => {
  const { marketId, type, price, qty } = req.body;
  if (!marketId || (type !== "Yes" && type !== "No") || typeof price !== "number" || typeof qty !== "number" || qty <= 0 || price <= 0 || price >= 100) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Verify user has the positions to sell
      const userPos = await tx.position.findUnique({
        where: { userId_marketId_type: { userId: req.userId!, marketId, type } },
      });

      if (!userPos || userPos.qty < qty) {
        throw new Error("Insufficient position quantity to sell");
      }

      const market = await tx.market.findUnique({ where: { id: marketId } });
      if (!market) throw new Error("Market not found");

      // Parse orderbooks
      const yesBook = parseOrderBook(market.yesOrderbook);
      const noBook = parseOrderBook(market.noOrderbook);

      let remainingQty = qty;
      let cashCredited = 0;

      const sameBook = type === "Yes" ? yesBook : noBook;

      // Match with resting bids of the same type at or above the requested price
      sameBook.bids.sort((a, b) => b.price - a.price); // Highest first
      const newBids: LimitOrder[] = [];

      for (const bid of sameBook.bids) {
        if (remainingQty > 0 && bid.price >= price) {
          const matchQty = Math.min(remainingQty, bid.qty);
          const matchPayout = matchQty * bid.price;

          // Crediting cash to seller (us)
          cashCredited += matchPayout;

          // Decrement seller's position (us)
          await tx.position.update({
            where: { id: userPos.id },
            data: { qty: { decrement: matchQty } },
          });

          // Increment buyer's position
          const buyerPos = await tx.position.findUnique({
            where: { userId_marketId_type: { userId: bid.userId, marketId, type } },
          });
          if (buyerPos) {
            await tx.position.update({
              where: { id: buyerPos.id },
              data: { qty: { increment: matchQty } },
            });
          } else {
            await tx.position.create({
              data: { userId: bid.userId, marketId, type, qty: matchQty },
            });
          }

          // Log Order History
          await tx.orderHistory.create({
            data: { orderType: "Sell", type: type as any, qty: matchQty, price: bid.price, userId: req.userId!, marketId },
          });
          await tx.orderHistory.create({
            data: { orderType: "Buy", type: type as any, qty: matchQty, price: bid.price, userId: bid.userId, marketId },
          });

          remainingQty -= matchQty;
          bid.qty -= matchQty;

          if (bid.qty > 0) {
            newBids.push(bid);
          }
        } else {
          newBids.push(bid);
        }
      }
      sameBook.bids = newBids;

      // If there is still remaining qty, place resting Limit Order (ask)
      if (remainingQty > 0) {
        const orderId = uuidv4();
        sameBook.asks.push({
          id: orderId,
          userId: req.userId!,
          price,
          qty: remainingQty,
          side: "sell",
        });
        sameBook.asks.sort((a, b) => a.price - b.price); // Sort asks ascending
      }

      // Apply balance credit to seller
      if (cashCredited > 0) {
        await tx.user.update({
          where: { id: req.userId },
          data: { usdBalance: { increment: cashCredited } },
        });
      }

      const matchedQty = qty - remainingQty;

      // Save updated orderbooks and volume
      await tx.market.update({
        where: { id: marketId },
        data: {
          yesOrderbook: yesBook as any,
          noOrderbook: noBook as any,
          totalQty: { increment: matchedQty },
        },
      });

      return { remainingQty };
    });

    res.json({ message: "Sell order processed successfully", ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET Markets
app.get("/markets", async (req, res) => {
  try {
    const markets = await prisma.market.findMany({
      include: {
        orders: true,
      },
    });

    const enrichedMarkets = markets.map((market) => {
      let yesPool = 50;
      let noPool = 50;

      for (const trade of market.orders) {
        const qty = Number(trade.qty);
        if (trade.orderType === "Buy") {
          if (trade.type === "Yes") {
            yesPool += qty;
          } else if (trade.type === "No") {
            noPool += qty;
          }
        } else if (trade.orderType === "Split") {
          yesPool += qty;
          noPool += qty;
        } else if (trade.orderType === "Merge") {
          yesPool -= qty;
          noPool -= qty;
        }
      }

      return {
        id: market.id,
        title: market.title,
        description: market.description,
        resolutionDescription: market.resolutionDescription,
        yesOrderbook: market.yesOrderbook,
        noOrderbook: market.noOrderbook,
        totalQty: market.totalQty,
        yesPool: Math.max(0, yesPool),
        noPool: Math.max(0, noPool),
      };
    });

    res.json(enrichedMarkets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET Market Trade History
app.get("/markets/:id/history", async (req, res) => {
  const { id } = req.params;
  try {
    const history = await prisma.orderHistory.findMany({
      where: { marketId: id },
      orderBy: { createdAt: "asc" },
    });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Resolve Market
app.post("/markets/:id/resolve", async (req, res) => {
  const { id } = req.params;
  const { outcome } = req.body; // "Yes" or "No"

  if (outcome !== "Yes" && outcome !== "No") {
    res.status(400).json({ error: "Invalid outcome. Must be 'Yes' or 'No'" });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const market = await tx.market.findUnique({
        where: { id },
      });

      if (!market) {
        throw new Error("Market not found");
      }

      if (market.resolution) {
        throw new Error("Market has already been resolved");
      }

      // Find all winning positions
      const winningPositions = await tx.position.findMany({
        where: {
          marketId: id,
          type: outcome,
        },
      });

      // Pay out winners ($1.00 / 100 cents per share)
      for (const pos of winningPositions) {
        const payout = pos.qty * 100;
        await tx.user.update({
          where: { id: pos.userId },
          data: {
            usdBalance: { increment: payout },
          },
        });
      }

      // Delete all positions for this market
      await tx.position.deleteMany({
        where: { marketId: id },
      });

      // Clear the orderbook (empty resting limit orders)
      const updatedMarket = await tx.market.update({
        where: { id },
        data: {
          resolution: outcome,
          yesOrderbook: { bids: [], asks: [] },
          noOrderbook: { bids: [], asks: [] },
        },
      });

      return updatedMarket;
    });

    res.json({ message: `Market successfully resolved to ${outcome}`, market: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
