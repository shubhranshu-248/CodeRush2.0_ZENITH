"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Sparkles, Download, Cpu, Command, Zap, Monitor, LayoutDashboard, History } from "lucide-react";
import Link from "next/link";

export interface HeaderProps {
  onRun?: () => void;
  onStop?: () => void;
  onExport?: () => void;
  isRunning?: boolean;
  mode?: "demo" | "live";
  onModeChange?: (mode: "demo" | "live") => void;
  hasGoal?: boolean;
  graphReady?: boolean;
  onReplay?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRun,
  onStop,
  onExport,
  isRunning = false,
  mode = "live",
  onModeChange,
  hasGoal = false,
  graphReady = false,
  onReplay,
}) => {
  const runLabel = mode === "demo"
    ? "Run Demo"
    : graphReady
      ? "Execute Workflow"
      : "Generate Graph";

  return (
    <header className="h-14 border-b border-white/[0.06] bg-[#08090a]/95 backdrop-blur-xl px-5 flex items-center justify-between z-20 sticky top-0">
      {/* Brand Identity & Model Status */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-3 group">
          {/* Animated brand icon */}
          <motion.div
            className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold border border-indigo-400/30 group-hover:from-indigo-500 group-hover:to-indigo-400 transition-colors"
            animate={isRunning ? {
              boxShadow: [
                "0 0 12px rgba(99,102,241,0.4)",
                "0 0 24px rgba(99,102,241,0.7)",
                "0 0 12px rgba(99,102,241,0.4)",
              ],
            } : {
              boxShadow: "0 0 15px rgba(99,102,241,0.5)",
            }}
            transition={isRunning ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
          >
            <Sparkles className={`w-4 h-4 text-white ${isRunning ? "animate-pulse" : ""}`} />
          </motion.div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-gray-100 tracking-tight group-hover:text-indigo-300 transition-colors">ForgeAI</h1>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isRunning ? "running" : "idle"}
                  initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge variant={isRunning ? "warning" : "success"} showDot className="py-0 text-[10px]">
                    {isRunning ? "Executing" : "System Nominal"}
                  </Badge>
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="text-[10px] text-gray-500 font-medium tracking-wide">
              AE-03 Unified Agent Workflow Orchestrator
            </p>
          </div>
        </Link>

        <div className="hidden md:flex items-center space-x-2.5 pl-4 border-l border-white/[0.06]">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-gray-400 hover:border-white/[0.12] hover:text-gray-300 transition-all cursor-default">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-gray-300 font-medium">Llama 3.3 70B</span>
          </div>

          {/* Mode Toggle — animated pill */}
          <div className="flex items-center space-x-0.5 bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5 relative">
            {(["live", "demo"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onModeChange?.(m)}
                className={`relative flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-all z-10 ${
                  mode === m ? "text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {mode === m && (
                  <motion.div
                    layoutId="mode-toggle"
                    className={`absolute inset-0 rounded-md shadow-sm ${
                      m === "live" ? "bg-emerald-600/80" : "bg-indigo-600/80"
                    }`}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  {m === "live" ? <Zap className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                  {m === "live" ? "Live" : "Demo"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-2.5">
        <Link
          href="/dashboard"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-gray-400 hover:text-gray-200 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>

        {onReplay && (
          <Button variant="secondary" size="sm" onClick={onReplay}>
            <History className="w-3.5 h-3.5 text-gray-400" />
            <span>Replay</span>
          </Button>
        )}

        <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500 bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-md hover:border-white/[0.1] transition-colors cursor-default">
          <Command className="w-3 h-3 text-gray-600" />
          <span className="font-mono text-[10px]">K</span>
        </div>

        <Button variant="secondary" size="sm" onClick={onExport}>
          <Download className="w-3.5 h-3.5 text-gray-400" />
          <span>Export</span>
        </Button>

        <AnimatePresence mode="wait">
          {!isRunning ? (
            <motion.div
              key="run"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="primary"
                size="sm"
                onClick={onRun}
                disabled={mode === "live" && !hasGoal}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{runLabel}</span>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="stop"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Button variant="danger" size="sm" onClick={onStop}>
                <Square className="w-3 h-3" />
                <span>Stop</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
