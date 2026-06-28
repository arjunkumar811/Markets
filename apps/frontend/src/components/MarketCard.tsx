import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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

interface MarketCardProps {
  market: Market;
}

export const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  const navigate = useNavigate();

  const prob = calculateProbability(market.yesPool ?? 50, market.noPool ?? 50).yes;


  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/markets/${market.id}`)}
      className="flex flex-col justify-between p-4 rounded-xl bg-brand-card border border-brand-border hover:border-zinc-700 cursor-pointer hover:shadow-xl hover:shadow-black/50 transition-all"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-brand-border">
            {market.title.includes("Solana") ? "SOL" : "AI"}
          </span>
          <span>{market.totalQty} Vol</span>
        </div>

        {/* Question Title */}
        <h3 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2 mb-4 h-10">
          {market.title}
        </h3>
      </div>

      {/* Stats and YES/NO display */}
      <div>
        {/* Probability display */}
        <div className="flex items-end justify-between mb-2">
          <span className="text-xs text-zinc-400">Yes Probability</span>
          <span className="text-lg font-bold text-yes">{prob}%</span>
        </div>

        {/* Animated Bar */}
        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${prob}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-yes"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-yes/10 text-yes border border-yes/20 hover:bg-yes hover:text-white transition-all cursor-pointer">
            Yes
          </button>
          <button className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-no/10 text-no border border-no/20 hover:bg-no hover:text-white transition-all cursor-pointer">
            No
          </button>
        </div>
      </div>
    </motion.div>
  );
};
