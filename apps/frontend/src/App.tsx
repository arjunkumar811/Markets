import { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSupabase } from "./hooks/useSuparbase";
import { useUser } from "./hooks/useUser";
import { TopNavbar } from "./components/TopNavbar";
import { Sidebar } from "./components/Sidebar";
import { MarketCard } from "./components/MarketCard";
import { MarketPage } from "./pages/MarketPage";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import "./App.css";

interface Market {
  id: string;
  title: string;
  description: string;
  resolutionDescription: string;
  yesOrderbook: any;
  noOrderbook: any;
  totalQty: number;
}

interface Position {
  id: string;
  marketId: string;
  type: "Yes" | "No";
  qty: number;
  market: Market;
}

interface OrderHistory {
  id: string;
  orderType: "Buy" | "Sell" | "Split" | "Merge";
  qty: number;
  price: number;
  userId: string;
  marketId: string;
  market: Market;
}

const BACKEND_URL = "http://localhost:3000";

function App() {
  const claims = useUser();
  const supabase = useSupabase();

  // State definitions
  const [markets, setMarkets] = useState<Market[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeSidebar, setActiveSidebar] = useState<string>("Markets");
  const [loadingMarkets, setLoadingMarkets] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Balance & Portfolio
  const [balance, setBalance] = useState<number>(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<OrderHistory[]>([]);

  // Fetch Markets
  const fetchMarkets = async () => {
    setLoadingMarkets(true);
    setErrorText(null);
    try {
      const res = await axios.get(`${BACKEND_URL}/markets`);
      setMarkets(res.data);
    } catch (err: any) {
      console.error("Error loading markets:", err);
      setErrorText("Failed to retrieve market configurations. Ensure the backend API is online.");
    } finally {
      setLoadingMarkets(false);
    }
  };

  // Sync user stats
  const fetchUserData = async () => {
    if (!claims) return;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      const headers = { Authorization: token };

      const balRes = await axios.get(`${BACKEND_URL}/balance`, { headers });
      setBalance(balRes.data.balance);

      const posRes = await axios.get(`${BACKEND_URL}/position`, { headers });
      setPositions(posRes.data);

      const histRes = await axios.get(`${BACKEND_URL}/history`, { headers });
      setHistory(histRes.data);
    } catch (err) {
      console.error("Error refreshing portfolio stats:", err);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [claims]);

  useEffect(() => {
    // Listen to changes on Market and OrderHistory tables
    const marketChannel = supabase
      .channel("public-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Market" },
        () => {
          fetchMarkets();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "OrderHistory" },
        () => {
          fetchMarkets();
          fetchUserData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(marketChannel);
    };
  }, [claims]);

  const handleConnectWallet = async () => {
    await supabase.auth.signInWithWeb3({
      chain: "solana",
      statement: "Access Polymarket Pro Platform",
    });
  };

  const handleDisconnectWallet = async () => {
    await supabase.auth.signOut();
    setBalance(0);
    setPositions([]);
    setHistory([]);
  };

  const formatUSD = (cents: number) => {
    return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  const getPortfolioWinRate = () => {
    if (history.length === 0) return "0.0%";
    const sells = history.filter((h) => h.orderType === "Sell");
    if (sells.length === 0) return "0.0% (No closed trades)";
    const profitable = sells.filter((s) => s.price > 50).length;
    return `${((profitable / sells.length) * 100).toFixed(1)}%`;
  };

  // Dashboard component containing feed and grids
  const DashboardView = () => (
    <AnimatePresence mode="wait">
      {activeSidebar === "Markets" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-col gap-6"
        >
          {/* Category Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {["All", "Crypto", "AI & Tech", "Politics", "Pop Culture"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-zinc-800 border-zinc-700 text-white font-semibold"
                    : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Market Cards Feed Grid */}
          {loadingMarkets ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 rounded-xl bg-brand-card/40 border border-brand-border animate-pulse" />
              ))}
            </div>
          ) : markets.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 border border-brand-border rounded-xl bg-brand-card/20">
              No active markets configured in database yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {markets.map((m) => (
                <MarketCard
                  key={m.id}
                  market={m}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeSidebar === "Portfolio" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="max-w-4xl mx-auto flex flex-col gap-6"
        >
          {/* Advanced Win/Loss Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Estimated Balance</span>
              <h3 className="text-2xl font-bold text-white mt-1">{formatUSD(balance)}</h3>
            </div>
            <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Positions</span>
              <h3 className="text-2xl font-bold text-primary-blue mt-1">{positions.length} markets</h3>
            </div>
            <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Trading Win Rate</span>
              <h3 className="text-2xl font-bold text-yes mt-1">{getPortfolioWinRate()}</h3>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-brand-card border border-brand-border shadow-xl">
            <h3 className="text-sm font-bold text-zinc-200 mb-4 uppercase tracking-wider">Active Holdings</h3>
            {positions.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                No active contract positions found. Open orders on the Markets page.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-brand-border text-zinc-500 font-semibold uppercase">
                      <th className="pb-3 pl-3">Asset Market</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3 text-right">Quantity</th>
                      <th className="pb-3 text-right pr-3">Max Settled Payout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => (
                      <tr key={p.id} className="border-b border-brand-border/40 hover:bg-zinc-950/30 transition-all">
                        <td className="py-3.5 pl-3 font-semibold text-zinc-200">{p.market?.title || p.marketId}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.type === "Yes" ? "bg-yes/10 text-yes border border-yes/20" : "bg-no/10 text-no border border-no/20"
                          }`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-mono text-zinc-300">{p.qty} shares</td>
                        <td className="py-3.5 text-right font-mono text-yes pr-3">{formatUSD(p.qty * 100)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeSidebar === "History" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="max-w-4xl mx-auto"
        >
          <div className="p-6 rounded-2xl bg-brand-card border border-brand-border shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Transaction Order History</h3>
              <button onClick={fetchUserData} className="p-1.5 rounded bg-zinc-900 border border-brand-border text-zinc-400 hover:text-white cursor-pointer transition-all">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                No matching order history logs found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-brand-border text-zinc-500 font-semibold uppercase">
                      <th className="pb-3 pl-3">Order Type</th>
                      <th className="pb-3">Market</th>
                      <th className="pb-3 text-right">Shares</th>
                      <th className="pb-3 text-right pr-3">Contract Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id} className="border-b border-brand-border/40 hover:bg-zinc-950/30 transition-all">
                        <td className="py-3.5 pl-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            h.orderType === "Buy"
                              ? "bg-yes/10 text-yes border border-yes/20"
                              : h.orderType === "Sell"
                              ? "bg-no/10 text-no border border-no/20"
                              : "bg-primary-blue/10 text-primary-blue border border-primary-blue/20"
                          }`}>
                            {h.orderType}
                          </span>
                        </td>
                        <td className="py-3.5 text-zinc-200 font-semibold max-w-sm truncate">{h.market?.title || h.marketId}</td>
                        <td className="py-3.5 text-right font-mono text-zinc-300">{h.qty}</td>
                        <td className="py-3.5 text-right font-mono text-zinc-300 pr-3">
                          {h.price === 100 ? "$1.00 (Pair)" : `${h.price}¢`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <BrowserRouter>
      <div className="relative min-h-screen bg-brand-bg text-zinc-100 flex flex-col grain-overlay">
        {/* Background Radial Glow Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-full h-[600px] radial-glow-blue opacity-80" />
          <div className="absolute top-1/3 right-1/4 w-full h-[500px] radial-glow-purple opacity-60" />
          <div className="absolute top-2/3 left-10 w-full h-[400px] radial-glow-green opacity-40" />
        </div>

        {/* Main Top Header Navigation */}
        <TopNavbar
          claims={claims}
          balance={balance}
          onConnectWallet={handleConnectWallet}
          onDisconnectWallet={handleDisconnectWallet}
        />

        {/* Main Dashboard Layout */}
        <div className="flex flex-1 relative z-10">
          <Sidebar activeSidebar={activeSidebar} setActiveSidebar={setActiveSidebar} />

          <main className="flex-1 p-6 overflow-y-auto">
            {errorText && (
              <div className="mb-6 p-4 rounded-xl bg-no/5 border border-no/20 text-no text-sm flex justify-between items-center">
                <span>{errorText}</span>
                <button
                  onClick={fetchMarkets}
                  className="px-3 py-1 rounded bg-no text-white text-xs font-semibold cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            )}

            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/markets/:marketId" element={<MarketPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
