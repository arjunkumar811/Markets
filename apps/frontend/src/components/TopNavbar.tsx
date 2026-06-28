import React from "react";
import { Search, Bell, Wallet, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

interface TopNavbarProps {
  claims: any;
  balance: number;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  claims,
  balance,
  onConnectWallet,
  onDisconnectWallet,
}) => {
  const formatUSD = (cents: number) => {
    return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-brand-bg/85 backdrop-blur-md border-b border-brand-border">
      {/* Left logo */}
      <div className="flex items-center gap-6">
        <a href="/" className="flex items-center gap-2 text-lg font-bold text-white tracking-wide">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-blue/15 border border-primary-blue/30 text-primary-blue">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span>Polymarket</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary-blue/10 text-primary-blue border border-primary-blue/20">PRO</span>
        </a>
      </div>

      {/* Center Search Bar */}
      <div className="flex items-center w-full max-w-md px-3 py-1.5 rounded-lg bg-zinc-900 border border-brand-border focus-within:border-primary-blue/50 focus-within:ring-1 focus-within:ring-primary-blue/50 transition-all">
        <Search className="w-4 h-4 text-zinc-500 mr-2" />
        <input
          type="text"
          placeholder="Search markets..."
          className="w-full text-sm text-zinc-200 bg-transparent border-none outline-none placeholder-zinc-500"
        />
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
          <span>⌘</span>K
        </kbd>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center gap-4">
        {claims && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-blue/5 border border-primary-blue/20 text-xs font-semibold text-primary-blue"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>{formatUSD(balance)}</span>
          </motion.div>
        )}

        <button className="relative p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-brand-border transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary-blue animate-pulse" />
        </button>

        {!claims ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onConnectWallet}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary-blue hover:bg-primary-blue/90 text-xs font-semibold text-white shadow-lg shadow-primary-blue/15 hover:shadow-primary-blue/25 transition-all cursor-pointer"
          >
            Connect Wallet
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onDisconnectWallet}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-brand-border text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            </div>
            <span>{claims.sub ? `${claims.sub.slice(0, 4)}...${claims.sub.slice(-4)}` : "Wallet"}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </motion.button>
        )}
      </div>
    </header>
  );
};
