"use client";

import { useEffect, useState } from "react";
import { Loader2, ExternalLink, Trophy, ArrowRight, Info } from "lucide-react";
import { Card } from "./Card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ComparisonListing {
  id: string;
  address: string;
  price: number;
  ping: number;
  floor?: string;
  source: string;
  sourceUrl: string;
}

interface ComparisonCardProps {
  matchId: string;
  currentPrice: number;
  currentSource: string;
}

export function ComparisonCard({ matchId, currentPrice, currentSource }: ComparisonCardProps) {
  const [comparisons, setComparisons] = useState<ComparisonListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;

    fetch(`/api/matches/${matchId}/comparisons`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setComparisons(data.comparisons || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) {
    return (
      <Card className="p-6 bg-white/5 border-white/10">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
        </div>
      </Card>
    );
  }

  if (comparisons.length === 0) {
    return null;
  }

  const allSources = [
    { source: currentSource, price: currentPrice, url: "#", isCurrent: true },
    ...comparisons.map(c => ({ source: c.source, price: c.price, url: c.sourceUrl, isCurrent: false }))
  ].sort((a, b) => a.price - b.price);

  const bestPrice = allSources[0];
  const savings = currentPrice - bestPrice.price;

  return (
    <Card className="p-6 bg-white/5 border-white/10 overflow-visible" glow>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-500" />
            Price Comparison
          </h2>
          <p className="text-xs text-slate-500 mt-1">Same listing on other platforms</p>
        </div>
        {savings > 0 && (
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1 animate-pulse">
            <Trophy className="h-3 w-3" />
            Potential Savings
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {allSources.map((item, idx) => (
          <div 
            key={idx}
            className={cn(
              "flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
              item.isCurrent 
                ? "bg-amber-500/10 border-amber-500/30" 
                : "bg-white/5 border-white/10 hover:border-white/20"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs",
                item.isCurrent ? "bg-amber-500 text-white" : "bg-white/10 text-slate-400"
              )}>
                {item.source.substring(0, 3).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {item.source === '591' ? '591 Rent' : item.source}
                  {item.isCurrent && <span className="ml-2 text-[10px] text-amber-500 uppercase">Current</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {new Intl.NumberFormat("zh-TW", {
                    style: "currency",
                    currency: "TWD",
                    maximumFractionDigits: 0,
                  }).format(item.price)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {idx === 0 && allSources.length > 1 && (
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                  Best Price
                </span>
              )}
              {item.isCurrent ? (
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Info className="h-4 w-4 text-slate-600" />
                </div>
              ) : (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500/20 flex items-center justify-center transition-colors group"
                >
                  <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-amber-500" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {savings > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20"
        >
          <p className="text-sm text-emerald-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Save <strong>{new Intl.NumberFormat("zh-TW", {
              style: "currency",
              currency: "TWD",
              maximumFractionDigits: 0,
            }).format(savings)}</strong>/mo with {bestPrice.source === '591' ? '591 Rent' : bestPrice.source}
          </p>
        </motion.div>
      )}
    </Card>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
