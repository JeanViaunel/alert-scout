"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
  centered?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  children,
  centered = false,
}: PageHeaderProps) {
  return (
    <div className={`mb-8 ${centered ? "text-center" : ""}`}>
      {backHref && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4"
        >
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className={centered ? "mx-auto" : ""}>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </motion.div>
    </div>
  );
}
