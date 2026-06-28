import React from "react";
import { BarChart3, Briefcase, History, Eye, PieChart, Trophy, Settings } from "lucide-react";

interface SidebarProps {
  activeSidebar: string;
  setActiveSidebar: (val: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSidebar, setActiveSidebar }) => {
  const menuItems = [
    { id: "Markets", label: "Markets", icon: BarChart3 },
    { id: "Portfolio", label: "Portfolio", icon: Briefcase },
    { id: "History", label: "History", icon: History },
    { id: "Watchlist", label: "Watchlist", icon: Eye },
    { id: "Analytics", label: "Analytics", icon: PieChart },
    { id: "Leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "Settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 flex flex-col justify-between p-4 bg-brand-bg border-r border-brand-border h-[calc(100vh-57px)] sticky top-[57px]">
      {/* Navigation menu */}
      <div className="flex flex-col gap-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSidebar === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSidebar(item.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-zinc-900 border border-brand-border text-white shadow-inner shadow-white/5"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary-blue" : "text-zinc-500"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer statistics */}
      <div className="flex flex-col gap-3 p-3 rounded-xl bg-zinc-950 border border-brand-border text-[11px] text-zinc-500">
        <div className="flex items-center justify-between">
          <span>Solana Gas:</span>
          <span className="font-semibold text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            0.00005 SOL
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Network:</span>
          <span className="font-semibold text-zinc-300">Solana Mainnet</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Latency:</span>
          <span className="font-semibold text-zinc-300">12ms</span>
        </div>
      </div>
    </aside>
  );
};
