"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  as?: "div" | "button" | "a";
  href?: string;
}

export function Card({
  children,
  className,
  hover = true,
  glow = false,
  onClick,
  as = "div",
  href,
}: CardProps) {
  const baseClasses = cn(
    "relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/50",
    "border border-slate-200 dark:border-white/10",
    "transition-all duration-300",
    hover && "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20",
    glow && "hover:border-amber-500/30",
    onClick && "cursor-pointer",
    className
  );

  const content = (
    <>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/[0.02] dark:to-transparent pointer-events-none" />
      
      {/* Glow effect */}
      {glow && (
        <div className="absolute -inset-px bg-gradient-to-r from-amber-500/20 via-primary/20 to-amber-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      )}
      
      <div className="relative">{children}</div>
    </>
  );

  if (as === "a" && href) {
    return (
      <motion.a
        href={href}
        className={`group block ${baseClasses}`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {content}
      </motion.a>
    );
  }

  if (as === "button" || onClick) {
    return (
      <motion.button
        onClick={onClick}
        className={`group w-full text-left ${baseClasses}`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {content}
      </motion.button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    positive: boolean;
  };
  color?: "default" | "primary" | "success" | "warning" | "danger";
}

const colorSchemes = {
  default: {
    bg: "bg-slate-100 dark:bg-slate-800",
    icon: "text-slate-600 dark:text-slate-400",
  },
  primary: {
    bg: "bg-primary/10",
    icon: "text-primary",
  },
  success: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-600",
  },
  warning: {
    bg: "bg-amber-500/10",
    icon: "text-amber-600",
  },
  danger: {
    bg: "bg-rose-500/10",
    icon: "text-rose-600",
  },
};

export function StatCard({ icon: Icon, label, value, trend, color = "default" }: StatCardProps) {
  const colors = colorSchemes[color];

  return (
    <Card className="p-6" hover>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${colors.icon}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          </div>
        </div>
        {trend && (
          <div className={`text-xs font-medium ${trend.positive ? "text-emerald-600" : "text-rose-600"}`}>
            {trend.positive ? "+" : ""}{trend.value}%
          </div>
        )}
      </div>
    </Card>
  );
}

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-4"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
        <Icon className="h-10 w-10 text-primary/60" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">{description}</p>
      {action && (
        <a
          href={action.href}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
        >
          {action.label}
        </a>
      )}
    </motion.div>
  );
}
