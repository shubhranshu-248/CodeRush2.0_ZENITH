"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none select-none cursor-pointer";

  const variants = {
    primary:
      "bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-[0_1px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_2px_20px_rgba(99,102,241,0.4)] border border-indigo-400/25",
    secondary:
      "bg-[#12141a] hover:bg-[#181b23] text-gray-300 border border-white/[0.06] hover:border-white/[0.12] shadow-sm hover:shadow-md",
    outline:
      "border border-white/[0.08] text-gray-400 hover:bg-white/[0.04] hover:border-white/[0.15] hover:text-gray-200",
    danger:
      "bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-[0_1px_10px_rgba(244,63,94,0.25)] hover:shadow-[0_2px_16px_rgba(244,63,94,0.35)] border border-rose-400/25",
    ghost:
      "text-gray-500 hover:text-white hover:bg-white/[0.05]",
  };

  const sizes = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-3.5 py-2 text-sm gap-2",
    lg: "px-4 py-2.5 text-base gap-2.5",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
