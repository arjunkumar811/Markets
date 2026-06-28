import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ProbabilityChartProps {
  prob: number;
  tradeHistory: any[];
}

export const ProbabilityChart: React.FC<ProbabilityChartProps> = ({ prob, tradeHistory }) => {
  // Format the trade history into data points for the area chart
  const formatHistoryData = () => {
    if (!tradeHistory || tradeHistory.length === 0) {
      return [];
    }

    let yesPool = 50;
    let noPool = 50;

    return tradeHistory.map((trade) => {
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

      yesPool = Math.max(0, yesPool);
      noPool = Math.max(0, noPool);

      const total = yesPool + noPool;
      const currentProb = total > 0 ? (yesPool / total) * 100 : 50;
      const date = new Date(trade.createdAt || Date.now());

      return {
        time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        probability: Number(currentProb.toFixed(2)),
      };
    });
  };

  const chartData = formatHistoryData();

  if (chartData.length === 0) {
    return (
      <div className="w-full bg-brand-card border border-brand-border rounded-xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[200px]">
        <span className="text-zinc-500 text-sm font-semibold mb-2">No Market History Yet</span>
        <span className="text-zinc-600 text-xs">Be the first to trade and seed the probability trend graph.</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-brand-card border border-brand-border rounded-xl p-4 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Probability Trend</span>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold text-white">{prob}%</h4>
            <span className="text-xs text-yes font-medium font-mono">Live Sync</span>
          </div>
        </div>
        <div className="flex gap-1.5 p-1 rounded-lg bg-zinc-950 border border-brand-border">
          {["1H", "24H", "7D", "ALL"].map((t) => (
            <button
              key={t}
              className={`text-[9px] font-bold px-2.5 py-1 rounded cursor-pointer ${
                t === "ALL"
                  ? "bg-primary-blue text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              stroke="#4b5563"
              fontSize={8}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#4b5563"
              fontSize={8}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#09090b",
                borderColor: "rgba(255,255,255,0.06)",
                borderRadius: "8px",
                fontSize: "10px",
                color: "#fff",
              }}
            />
            <Area
              type="monotone"
              dataKey="probability"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#probGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
