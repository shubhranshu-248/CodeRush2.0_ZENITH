"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Layers, Bot, GripVertical, Compass, Loader2, Play, Sparkles } from "lucide-react";

export interface SidebarProps {
  goal: string;
  onGoalChange: (goal: string) => void;
  onGenerateGraph?: () => void;
  onSubmitGoal?: () => void;
  isRunning?: boolean;
  isGenerating?: boolean;
  graphReady?: boolean;
}

const agentPalette = [
  { label: "Planner Agent", color: "indigo", rgb: "99,102,241" },
  { label: "Parallel Researcher", color: "cyan", rgb: "6,182,212" },
  { label: "Writer Agent", color: "emerald", rgb: "16,185,129" },
  { label: "Verifier Agent", color: "amber", rgb: "245,158,11" },
  { label: "Approval Gate", color: "rose", rgb: "244,63,94" },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({
  goal,
  onGoalChange,
  onGenerateGraph,
  onSubmitGoal,
  isRunning = false,
  isGenerating = false,
  graphReady = false,
}) => {
  const presetGoals = [
    "Research Agentic AI architecture & synthesize technical report",
    "Audit system performance & recommend scalability optimizations",
    "Analyze quantum computing impact on modern cryptography",
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && goal.trim() && !isRunning) {
      if (graphReady) {
        onSubmitGoal?.();
      } else {
        onGenerateGraph?.();
      }
    }
  };

  const busy = isRunning || isGenerating;
  const charPercent = Math.min(100, (goal.length / 500) * 100);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-80 border-r border-white/[0.06] bg-[#0a0b0f]/90 backdrop-blur-xl flex flex-col justify-between p-4 space-y-5 z-10"
    >
      <div className="space-y-5">
        {/* Goal Input Section */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Natural Language Goal</span>
            </label>
            <span className={`text-[10px] font-mono tabular-nums transition-colors ${
              goal.length > 400 ? "text-amber-400" : "text-gray-600"
            }`}>
              {goal.length}/500
            </span>
          </div>

          {/* Textarea with focus glow */}
          <div className="relative group">
            <textarea
              value={goal}
              onChange={(e) => onGoalChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the workflow goal (e.g. Research AI trends, synthesize paper and verify accuracy)..."
              maxLength={500}
              disabled={busy}
              className="w-full h-28 p-3 text-[12px] leading-relaxed bg-[#08090a] border border-white/[0.08] rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 focus:shadow-[0_0_20px_rgba(99,102,241,0.08)] transition-all resize-none disabled:opacity-40 disabled:cursor-not-allowed"
            />
            {/* Character progress bar */}
            <div className="absolute bottom-2 right-2 w-8 h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  charPercent > 80 ? "bg-amber-400/60" : "bg-indigo-400/40"
                }`}
                style={{ width: `${charPercent}%` }}
              />
            </div>
          </div>

          {/* Two-phase buttons: Generate Graph → Execute Workflow */}
          <div className="space-y-1.5">
            <AnimatePresence mode="wait">
              {!graphReady ? (
                <motion.div
                  key="generate"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={onGenerateGraph}
                    disabled={!goal.trim() || busy}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isGenerating ? "Compiling Graph..." : "Generate Graph"}</span>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="execute"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5"
                >
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={onSubmitGoal}
                    disabled={busy}
                  >
                    {isRunning ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>{isRunning ? "Executing..." : "Execute Workflow"}</span>
                  </Button>
                  <button
                    onClick={() => onGoalChange("")}
                    disabled={busy}
                    className="w-full text-center text-[10px] text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-40 py-1"
                  >
                    Reset &amp; New Goal
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Keyboard shortcut hint */}
            {goal.trim() && !busy && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[9px] text-gray-600 text-center"
              >
                Press <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] font-mono text-gray-500">Ctrl+Enter</kbd> to {graphReady ? "execute" : "generate"}
              </motion.p>
            )}
          </div>

          {/* Quick Presets */}
          <div className="pt-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-600 block mb-2 flex items-center gap-1">
              <Compass className="w-3 h-3 text-gray-500" />
              Quick Presets
            </span>
            <div className="space-y-1">
              {presetGoals.map((preset, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onGoalChange(preset)}
                  disabled={busy}
                  className="w-full text-left p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.1] text-[11px] text-gray-500 hover:text-gray-300 transition-all truncate block disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {preset}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Agent Palette Section */}
        <div className="pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-[11px] font-semibold text-gray-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agent Palette</span>
            </h4>
            <span className="text-[10px] text-gray-600 font-mono">5 Agents</span>
          </div>

          <div className="space-y-1.5 text-xs">
            {agentPalette.map((agent, idx) => (
              <motion.div
                key={idx}
                whileHover={{ x: 2, scale: 1.01 }}
                className="p-2.5 rounded-xl bg-[#0d0f14] border border-white/[0.06] hover:border-white/[0.12] text-gray-300 flex items-center justify-between cursor-grab transition-all group"
                style={{
                  ["--agent-glow" as string]: `rgba(${agent.rgb},0.15)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: `rgba(${agent.rgb},1)`,
                      boxShadow: `0 0 6px rgba(${agent.rgb},0.8)`,
                    }}
                  />
                  <span className="font-medium text-[11px]">{agent.label}</span>
                </div>
                <GripVertical className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-500 transition-colors" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
