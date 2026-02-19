"use client";

import { Radar } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 20, text: "text-lg" },
  md: { icon: 28, text: "text-xl" },
  lg: { icon: 36, text: "text-2xl" },
};

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const { icon, text } = sizes[size];

  return (
    <Link href="/" className={`flex items-center gap-2.5 group ${className}`}>
      <motion.div
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Icon container */}
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25">
          <Radar className="text-white" size={icon * 0.6} strokeWidth={2.5} />
        </div>
      </motion.div>
      
      {showText && (
        <span className={`font-bold tracking-tight text-slate-900 dark:text-white ${text}`}>
          Alert<span className="text-amber-500">Scout</span>
        </span>
      )}
    </Link>
  );
}

export function LogoMinimal({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-amber-500/30 blur-lg rounded-full animate-pulse" />
        <div className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/30 p-3">
          <Radar className="text-white" size={size * 0.5} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}
