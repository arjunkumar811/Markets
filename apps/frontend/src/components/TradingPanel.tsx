import React from "react";
import { HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

interface TradingPanelProps {
  tradeTab: "buy" | "sell" | "split" | "merge";
  setTradeTab: (tab: "buy" | "sell" | "split" | "merge") => void;
  selectedOutcome: "Yes" | "No";
  setSelectedOutcome: (outcome: "Yes" | "No") => void;
  priceInput: number;
  setPriceInput: (price: number) => void;
  qtyInput: number;
  setQtyInput: (qty: number) => void;
  loading: boolean;
  message: { text: string; isError: boolean } | null;
  onSubmit: (e: React.FormEvent) => void;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
  tradeTab,
  setTradeTab,
  selectedOutcome,
  setSelectedOutcome,
  priceInput,
  setPriceInput,
  qtyInput,
  setQtyInput,
  loading,
  message,
  onSubmit,
}) => {
  const formatUSD = (cents: number) => {
    return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  const cost =
    tradeTab === "split" || tradeTab === "merge" ? qtyInput * 100 : qtyInput * priceInput;

  return (
    <div className="w-full bg-brand-card border border-brand-border rounded-xl p-4 shadow-xl">
      {/* Top Tabs */}
      <div className="flex border-b border-brand-border mb-4">
        {(["buy", "sell", "split", "merge"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setTradeTab(tab)}
            className={`flex-1 pb-2.5 text-xs font-bold capitalize transition-all cursor-pointer border-b-2 ${
              tradeTab === tab
                ? "text-primary-blue border-primary-blue"
                : "text-zinc-500 hover:text-zinc-300 border-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Outcome Selector */}
        {(tradeTab === "buy" || tradeTab === "sell") && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedOutcome("Yes")}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedOutcome === "Yes"
                  ? "bg-yes text-white shadow-lg shadow-yes/20"
                  : "bg-zinc-900 border border-brand-border text-yes hover:bg-zinc-800"
              }`}
            >
              YES
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("No")}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedOutcome === "No"
                  ? "bg-no text-white shadow-lg shadow-no/20"
                  : "bg-zinc-900 border border-brand-border text-no hover:bg-zinc-800"
              }`}
            >
              NO
            </button>
          </div>
        )}

        {/* Limit Price */}
        {(tradeTab === "buy" || tradeTab === "sell") && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-zinc-500 flex items-center justify-between">
              <span>LIMIT PRICE</span>
              <span className="text-[9px] text-zinc-600">STRETCH RANGE: 1¢ - 99¢</span>
            </span>
            <div className="flex items-center px-3 py-2 rounded-lg bg-zinc-900 border border-brand-border focus-within:border-primary-blue/30 transition-all">
              <input
                type="number"
                min="1"
                max="99"
                value={priceInput}
                onChange={(e) => setPriceInput(Number(e.target.value))}
                className="w-full bg-transparent border-none text-sm text-zinc-200 font-bold outline-none"
                required
              />
              <span className="text-xs font-semibold text-zinc-500">¢</span>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-zinc-500">
            {tradeTab === "split" || tradeTab === "merge" ? "QUANTITY (PAIRS)" : "QUANTITY (SHARES)"}
          </span>
          <div className="flex items-center px-3 py-2 rounded-lg bg-zinc-900 border border-brand-border focus-within:border-primary-blue/30 transition-all">
            <input
              type="number"
              min="1"
              value={qtyInput}
              onChange={(e) => setQtyInput(Number(e.target.value))}
              className="w-full bg-transparent border-none text-sm text-zinc-200 font-bold outline-none"
              required
            />
            <span className="text-xs font-semibold text-zinc-500">QTY</span>
          </div>
        </div>

        {/* Cost details */}
        <div className="p-3 rounded-lg bg-zinc-950/60 border border-brand-border flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Total Value</span>
            <span className="font-semibold text-zinc-200">{formatUSD(cost)}</span>
          </div>
          {(tradeTab === "buy" || tradeTab === "sell") && (
            <div className="flex justify-between text-zinc-400">
              <span>Max Payout</span>
              <span className="font-semibold text-zinc-200">{formatUSD(qtyInput * 100)}</span>
            </div>
          )}
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span className="flex items-center gap-1">
              Estimated Fees <HelpCircle className="w-2.5 h-2.5" />
            </span>
            <span>$0.00</span>
          </div>
        </div>

        {/* Message notification */}
        {message && (
          <div
            className={`p-2.5 rounded-lg text-xs leading-snug border ${
              message.isError
                ? "bg-no/5 border-no/20 text-no"
                : "bg-yes/5 border-yes/20 text-yes"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer transition-all ${
            loading ? "bg-zinc-800 text-zinc-500 shadow-none" : ""
          } ${
            tradeTab === "split" || tradeTab === "merge"
              ? "bg-primary-blue shadow-primary-blue/20 hover:bg-primary-blue/90"
              : selectedOutcome === "Yes"
              ? "bg-yes shadow-yes/20 hover:bg-yes/90"
              : "bg-no shadow-no/20 hover:bg-no/90"
          }`}
        >
          {loading
            ? "Executing order..."
            : tradeTab === "split"
            ? "Split Pairs"
            : tradeTab === "merge"
            ? "Merge Pairs"
            : `${tradeTab.toUpperCase()} ${selectedOutcome.toUpperCase()}`}
        </motion.button>
      </form>
    </div>
  );
};
