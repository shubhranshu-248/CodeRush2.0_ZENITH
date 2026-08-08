"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge } from "lucide-react";

/* ── Speed presets ── */
const SPEED_OPTIONS: { label: string; value: number }[] = [
  { label: "0.5x", value: 3000 },
  { label: "1x", value: 1500 },
  { label: "2x", value: 750 },
];

const springTransition = { type: "spring" as const, stiffness: 400, damping: 28 };

interface IconButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, disabled, title, children }) => (
  <motion.button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    whileHover={disabled ? undefined : { scale: 1.06 }}
    whileTap={disabled ? undefined : { scale: 0.92 }}
    transition={springTransition}
    className={`flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.03] text-gray-400 transition-colors ${
      disabled
        ? "opacity-40 cursor-not-allowed"
        : "hover:bg-white/[0.06] hover:text-gray-100 hover:border-white/[0.1] cursor-pointer"
    }`}
  >
    {children}
  </motion.button>
);

/* ── Props ── */
export interface ReplayControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  currentStep: number;
  totalSteps: number;
  speed: number;
  onSpeedChange: (ms: number) => void;
  className?: string;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  currentStep,
  totalSteps,
  speed,
  onSpeedChange,
  className = "",
}) => {
  const displayStep = totalSteps === 0 ? 0 : Math.min(currentStep + 1, totalSteps);
  const progressPct = totalSteps === 0 ? 0 : (displayStep / totalSteps) * 100;

  const atStart = currentStep <= 0;
  const atEnd = totalSteps === 0 || currentStep >= totalSteps - 1;

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 ${className}`}
    >
      {/* ── Row: transport controls + speed selector ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <IconButton onClick={onStepBack} disabled={atStart} title="Step back">
            <SkipBack className="w-3.5 h-3.5" />
          </IconButton>

          <motion.button
            type="button"
            onClick={isPlaying ? onPause : onPlay}
            disabled={totalSteps === 0}
            whileHover={totalSteps === 0 ? undefined : { scale: 1.06 }}
            whileTap={totalSteps === 0 ? undefined : { scale: 0.92 }}
            transition={springTransition}
            title={isPlaying ? "Pause" : "Play"}
            className={`flex items-center justify-center w-9 h-9 rounded-lg border border-indigo-400/25 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_1px_12px_rgba(99,102,241,0.3)] transition-colors ${
              totalSteps === 0
                ? "opacity-40 cursor-not-allowed"
                : "hover:from-indigo-400 hover:to-indigo-500 cursor-pointer"
            }`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </motion.button>

          <IconButton onClick={onStepForward} disabled={atEnd} title="Step forward">
            <SkipForward className="w-3.5 h-3.5" />
          </IconButton>

          <IconButton onClick={onReset} disabled={totalSteps === 0} title="Reset">
            <RotateCcw className="w-3.5 h-3.5" />
          </IconButton>
        </div>

        {/* ── Speed selector ── */}
        <div className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-gray-500" />
          <div className="flex items-center rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
            {SPEED_OPTIONS.map((opt) => {
              const active = opt.value === speed;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  onClick={() => onSpeedChange(opt.value)}
                  whileTap={{ scale: 0.94 }}
                  transition={springTransition}
                  className={`relative px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    active ? "text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="speed-active-pill"
                      transition={springTransition}
                      className="absolute inset-0 rounded-md bg-indigo-500/80"
                    />
                  )}
                  <span className="relative z-10">{opt.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Progress indicator ── */}
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-mono tabular-nums text-gray-400 shrink-0">
          Step {displayStep} / {totalSteps}
        </span>
        <div className="relative flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-indigo-500"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={springTransition}
          />
        </div>
      </div>
    </div>
  );
};
