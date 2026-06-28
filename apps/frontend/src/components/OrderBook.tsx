import React from "react";

interface LimitOrder {
  id: string;
  userId: string;
  price: number;
  qty: number;
  side: "buy" | "sell";
}

interface OrderBookProps {
  yesOrderbook: { bids: LimitOrder[]; asks: LimitOrder[] };
  noOrderbook: { bids: LimitOrder[]; asks: LimitOrder[] };
}

export const OrderBook: React.FC<OrderBookProps> = ({ yesOrderbook, noOrderbook }) => {
  const getSpread = () => {
    const yesAsk = yesOrderbook?.asks?.[0]?.price || 50;
    const yesBid = yesOrderbook?.bids?.[0]?.price || 48;
    return Math.abs(yesAsk - yesBid);
  };

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-zinc-100">Order Book</h4>
        <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-900 border border-brand-border px-2 py-0.5 rounded">
          Spread: {getSpread()}¢
        </span>
      </div>

      {(!yesOrderbook?.bids?.length && !yesOrderbook?.asks?.length && !noOrderbook?.bids?.length && !noOrderbook?.asks?.length) ? (
        <div className="py-6 text-center text-xs text-zinc-500">
          No open orders yet. Be the first to place a limit trade!
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* Yes orderbook */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-yes mb-2 tracking-wide uppercase">YES Bids & Asks</span>
            <div className="grid grid-cols-2 text-[10px] font-semibold text-zinc-500 border-b border-brand-border pb-1.5 mb-1.5">
              <span>Price</span>
              <span className="text-right">Qty</span>
            </div>

            <div className="flex flex-col gap-1">
              {yesOrderbook?.bids?.map((order, idx) => (
                <div key={`yes-bid-${idx}`} className="relative flex justify-between text-xs py-1 px-1.5 rounded overflow-hidden">
                  <div className="absolute inset-0 bg-yes/5 origin-left" style={{ width: `${Math.min(100, (order.qty / 500) * 100)}%` }} />
                  <span className="relative font-semibold text-yes">{order.price}¢</span>
                  <span className="relative text-zinc-400 text-right">{order.qty}</span>
                </div>
              ))}
              {yesOrderbook?.asks?.map((order, idx) => (
                <div key={`yes-ask-${idx}`} className="relative flex justify-between text-xs py-1 px-1.5 rounded overflow-hidden">
                  <div className="absolute inset-0 bg-yes/5 origin-left opacity-60" style={{ width: `${Math.min(100, (order.qty / 500) * 100)}%` }} />
                  <span className="relative font-semibold text-yes/70">{order.price}¢</span>
                  <span className="relative text-zinc-500 text-right">{order.qty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* No orderbook */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-no mb-2 tracking-wide uppercase">NO Bids & Asks</span>
            <div className="grid grid-cols-2 text-[10px] font-semibold text-zinc-500 border-b border-brand-border pb-1.5 mb-1.5">
              <span>Price</span>
              <span className="text-right">Qty</span>
            </div>

            <div className="flex flex-col gap-1">
              {noOrderbook?.bids?.map((order, idx) => (
                <div key={`no-bid-${idx}`} className="relative flex justify-between text-xs py-1 px-1.5 rounded overflow-hidden">
                  <div className="absolute inset-0 bg-no/5 origin-left" style={{ width: `${Math.min(100, (order.qty / 500) * 100)}%` }} />
                  <span className="relative font-semibold text-no">{order.price}¢</span>
                  <span className="relative text-zinc-400 text-right">{order.qty}</span>
                </div>
              ))}
              {noOrderbook?.asks?.map((order, idx) => (
                <div key={`no-ask-${idx}`} className="relative flex justify-between text-xs py-1 px-1.5 rounded overflow-hidden">
                  <div className="absolute inset-0 bg-no/5 origin-left opacity-60" style={{ width: `${Math.min(100, (order.qty / 500) * 100)}%` }} />
                  <span className="relative font-semibold text-no/70">{order.price}¢</span>
                  <span className="relative text-zinc-500 text-right">{order.qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
