"use client";

import React from "react";

interface BadgeProps {
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  showDot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  showDot = true,
  children,
  className = "",
}) => {
  const styles = {
    success: "bg-emerald-950/30 text-emerald-300 border-emerald-500/20",
    warning: "bg-amber-950/30 text-amber-300 border-amber-500/20",
    error: "bg-rose-950/30 text-rose-300 border-rose-500/20",
    info: "bg-indigo-950/30 text-indigo-300 border-indigo-500/20",
    neutral: "bg-gray-900/40 text-gray-400 border-white/[0.06]",
  };

  const dotColors = {
    success: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]",
    warning: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]",
    error: "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.7)]",
    info: "bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.7)]",
    neutral: "bg-gray-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border backdrop-blur-sm transition-colors ${styles[variant]} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${variant !== "neutral" ? "animate-pulse" : ""} ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
};
