import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useSupabase } from "../hooks/useSuparbase";
import { useUser } from "../hooks/useUser";
import { TradingPanel } from "../components/TradingPanel";
import { OrderBook } from "../components/OrderBook";
import { ProbabilityChart } from "../components/ProbabilityChart";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Calendar, FileText, Share2, Bookmark } from "lucide-react";
import { calculateProbability } from "../services/probability";

interface Market {
  id: string;
  title: string;
  description: string;
  resolutionDescription: string;
  yesOrderbook: any;
  noOrderbook: any;
  totalQty: number;
  yesPool?: number;
  noPool?: number;
}

const BACKEND_URL = "http://localhost:3000";

export const MarketPage: React.FC = () => {
  const { marketId } = useParams<{ marketId: string }>();
  const claims = useUser();
  const supabase = useSupabase();

  // Market specific state
  const [market, setMarket] = useState<Market | null>(null);
  const [marketHistory, setMarketHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User balance & stats
  const [tradeTab, setTradeTab] = useState<"buy" | "sell" | "split" | "merge">("buy");
  const [selectedOutcome, setSelectedOutcome] = useState<"Yes" | "No">("Yes");
  const [priceInput, setPriceInput] = useState<number>(50);
  const [qtyInput, setQtyInput] = useState<number>(10);
  const [tradeLoading, setTradeLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const fetchMarketDetails = async () => {
    if (!marketId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch all markets and find the selected one
      const res = await axios.get(`${BACKEND_URL}/markets`);
      const found = res.data.find((m: Market) => m.id === marketId);
      if (found) {
        setMarket(found);
      } else {
        setError("Market not found.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load market parameters from API.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!marketId) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/markets/${marketId}/history`);
      setMarketHistory(res.data);
    } catch (err) {
      console.error("Error loading market history:", err);
    }
  };

  useEffect(() => {
    fetchMarketDetails();
    fetchHistory();
  }, [marketId]);

  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!market || !claims) return;
    setTradeLoading(true);
    setMessage(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("No active session");

      const headers = { Authorization: token };
      const url = `${BACKEND_URL}/${tradeTab}`;
      let body: any = { marketId: market.id, qty: Number(qtyInput) };

      if (tradeTab === "buy" || tradeTab === "sell") {
        body.type = selectedOutcome;
        body.price = Number(priceInput);
      }

      const res = await axios.post(url, body, { headers });
      setMessage({ text: res.data.message || "Order completed", isError: false });

      // Refresh stats
      await fetchMarketDetails();
      await fetchHistory();
    } catch (err: any) {
      console.error(err);
      setMessage({
        text: err.response?.data?.error || err.message || "Execution error",
        isError: true,
      });
    } finally {
      setTradeLoading(false);
    }
  };

  const getMarketProbability = (m: Market | null) => {
    if (!m) return 50;
    return calculateProbability(m.yesPool ?? 50, m.noPool ?? 50).yes;
  };

  const formatUSD = (cents: number) => {
    return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 animate-pulse">
        <div className="h-6 w-32 bg-zinc-800 rounded mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="h-28 bg-brand-card/40 rounded-2xl border border-brand-border" />
            <div className="h-64 bg-brand-card/40 rounded-2xl border border-brand-border" />
          </div>
          <div className="lg:col-span-1">
            <div className="h-96 bg-brand-card/40 rounded-2xl border border-brand-border" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Error Locating Market</h2>
        <p className="text-zinc-500 text-sm mb-6">{error || "This prediction market does not exist."}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-brand-border text-zinc-300 hover:text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Markets
        </Link>
      </div>
    );
  }

  const prob = getMarketProbability(market);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-4 flex flex-col gap-6"
    >
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left & Center: Info + Charts + Orderbook */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Header Panel */}
          <div className="p-6 rounded-2xl bg-brand-card border border-brand-border flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-blue/10 text-primary-blue border border-primary-blue/20">
                {market.title.includes("Solana") ? "SOL" : "AI & TECH"}
              </span>
              <div className="flex gap-2 text-zinc-500 hover:text-zinc-300">
                <button className="p-1.5 rounded hover:bg-zinc-800 cursor-pointer"><Share2 className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 rounded hover:bg-zinc-800 cursor-pointer"><Bookmark className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white leading-snug">{market.title}</h1>
            <p className="text-sm text-zinc-400 leading-relaxed pl-3 border-l-2 border-primary-blue/40">
              {market.description}
            </p>

            <div className="flex flex-wrap gap-4 text-xs text-zinc-500 border-t border-brand-border/40 pt-3.5 mt-2">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Closes Dec 31, 2026</span>
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Source: CoinGecko API</span>
            </div>
          </div>

          {/* Interactive Chart */}
          <ProbabilityChart prob={prob} tradeHistory={marketHistory} />

          {/* Orderbook depth */}
          <OrderBook yesOrderbook={market.yesOrderbook} noOrderbook={market.noOrderbook} />
        </div>

        {/* Right Sidebar: Trading Panel & Stats */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <TradingPanel
            tradeTab={tradeTab}
            setTradeTab={setTradeTab}
            selectedOutcome={selectedOutcome}
            setSelectedOutcome={setSelectedOutcome}
            priceInput={priceInput}
            setPriceInput={setPriceInput}
            qtyInput={qtyInput}
            setQtyInput={setQtyInput}
            loading={tradeLoading}
            message={message}
            onSubmit={handleTradeSubmit}
          />

          {/* Stats card */}
          <div className="p-4 rounded-xl bg-brand-card border border-brand-border flex flex-col gap-3 text-xs shadow-xl">
            <h4 className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary-blue" />
              Market Statistics
            </h4>
            <div className="grid grid-cols-2 gap-3 mt-1.5 text-zinc-500">
              <div>
                <span className="block text-[10px] uppercase">Total Volume</span>
                <span className="font-semibold text-zinc-300">{market.totalQty} contracts</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase">Collateral Locked</span>
                <span className="font-semibold text-zinc-300">{formatUSD(market.totalQty * 100)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
