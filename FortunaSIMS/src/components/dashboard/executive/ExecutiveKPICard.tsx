"use client";

import { ReactNode } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@/icons";

interface ExecutiveKPICardProps {
  title: string;
  value: number | string;
  growth: string;
  icon: ReactNode;
  gradient?: string;
  positive?: boolean;
  subtitle?: string;
}

export default function ExecutiveKPICard({
  title,
  value,
  growth,
  icon,
  gradient = "from-[#005F99] via-[#1B6FA8] via-[#7A3B72] to-[#C8102E]",
  positive = true,
  subtitle,
}: ExecutiveKPICardProps) {
  return (
    <div
className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br fortuna-gradient-live ${gradient} p-2 text-white shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,95,153,0.35)]`}
    >
      {/* Decorative Glow */}
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/10 blur-3xl transition-all duration-500 group-hover:scale-125" />

        {/* Premium Shimmer */}
<div className="absolute inset-0 overflow-hidden rounded-3xl">
  <div className="fortuna-shimmer absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>
</div>


      {/* Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.18)] backdrop-blur-md">
          {icon}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
  <span className="relative inline-flex h-3 w-3 rounded-full bg-white shadow-lg"></span>
</div>

          <div className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            {positive ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {growth}
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="relative z-10 3">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
          {title}
        </p>

        <h2 className="mt-2 text-[38px] font-extrabold tracking-tight">
          {value}
        </h2>

        {subtitle && (
          <p className="mt-3 text-xs text-white/80">
            {subtitle}
          </p>
        )}
      </div>

      {/* Footer */}
      {/* <div className="relative z-10 mt-3 flex items-center justify-between border-t border-white/15 pt-2">
        <span className="text-[11px] text-white/70">
          Live KPI Metrics
        </span>

        
      </div> */}
    </div>
  );
}