"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown, Calendar, ArrowDownRight } from "lucide-react";

interface PricePoint {
  date: string;
  price: number;
}

interface PriceHistoryProps {
  history: PricePoint[];
  currentPrice: number;
  firstSeen: string;
}

export function PriceHistory({ history, currentPrice, firstSeen }: PriceHistoryProps) {
  const latestPrice = history[history.length - 1]?.price || currentPrice;
  const initialPrice = history[0]?.price || currentPrice;
  const drop = initialPrice - latestPrice;
  const dropPercent = ((drop / initialPrice) * 100).toFixed(1);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-emerald-400" />
            Price History
          </h3>
          <p className="text-sm text-slate-400">Track price changes over time</p>
        </div>
        {drop > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
            <ArrowDownRight className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-xs text-emerald-400 font-medium leading-none">Price Drop</p>
              <p className="text-lg font-bold text-white leading-tight">
                -{dropPercent}%
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `NT$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #ffffff10',
                borderRadius: '12px',
                color: '#fff'
              }}
              itemStyle={{ color: '#fbbf24' }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#fbbf24" 
              strokeWidth={3}
              dot={{ fill: '#fbbf24', strokeWidth: 2, r: 4, stroke: '#0f172a' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="h-4 w-4" />
          First seen: {new Date(firstSeen).toLocaleDateString()}
        </div>
        <div className="text-slate-400">
          💰 Saved <span className="text-emerald-400 font-bold">NT${drop.toLocaleString()}</span> since listing
        </div>
      </div>
    </div>
  );
}
