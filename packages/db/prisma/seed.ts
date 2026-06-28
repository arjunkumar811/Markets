import { prisma } from "../index";

async function main() {
  console.log("Seeding database with default markets...");

  const count = await prisma.market.count();
  if (count > 0) {
    console.log("Markets already seeded.");
    return;
  }

  // Create Solana Hit $500 Market
  await prisma.market.create({
    data: {
      id: "sol-hit-500-2026",
      title: "Will Solana hit $500 in 2026?",
      description: "Resolves to Yes if Solana reaches $500.00 USD at any point in 2026 according to CoinGecko.",
      resolutionDescription: "Solana reaches $500.00 USD according to CoinGecko pricing.",
      yesOrderbook: { bids: [], asks: [] },
      noOrderbook: { bids: [], asks: [] },
      totalQty: 0
    }
  });

  // Create GPT-5 Release Market
  await prisma.market.create({
    data: {
      id: "gpt5-release-2026",
      title: "Will GPT-5 release before Q4 2026?",
      description: "Resolves to Yes if OpenAI releases GPT-5 publicly before October 1, 2026.",
      resolutionDescription: "Public availability announcement by OpenAI.",
      yesOrderbook: { bids: [], asks: [] },
      noOrderbook: { bids: [], asks: [] },
      totalQty: 0
    }
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
