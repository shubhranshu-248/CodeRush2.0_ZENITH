"use client";

import React, { memo } from "react";
import { Controls, Background, BackgroundVariant } from "@xyflow/react";
import { motion } from "framer-motion";
import { Play, Square, RotateCcw, Zap } from "lucide-react";

export interface FlowControlsProps {
  onRunDemo?: () => void;
  onStopDemo?: () => void;
  isRunning?: boolean;
  onReset?: () => void;
  mode?: "demo" | "live";
}

export const FlowControls: React.FC<FlowControlsProps> = memo(
  ({ onRunDemo, onStopDemo, isRunning = false, onReset, mode = "live" }) => {
    return (
      <>
        <Controls className="bg-gray-900 border border-gray-800 text-gray-300" />
        <Background
          color="#1e293b"
          variant={BackgroundVariant.Dots}
          gap={20}
          size={0.8}
        />

        {/* Demo mode controls */}
        {mode === "demo" && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {!isRunning ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onRunDemo}
                className="flex items-center gap-2 px-4 py-2 rounded-xl
                  bg-indigo-600 hover:bg-indigo-500
                  text-white text-xs font-semibold tracking-wide
                  shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30
                  transition-all duration-200"
              >
                <Play className="w-3.5 h-3.5" />
                Run Demo
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onStopDemo}
                className="flex items-center gap-2 px-4 py-2 rounded-xl
                  bg-red-600/90 hover:bg-red-500
                  text-white text-xs font-semibold tracking-wide
                  shadow-lg shadow-red-600/20 hover:shadow-red-500/30
                  transition-all duration-200"
              >
                <Square className="w-3 h-3" />
                Stop
              </motion.button>
            )}

            {!isRunning && onReset && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                  bg-white/[0.04] hover:bg-white/[0.08]
                  text-gray-500 hover:text-gray-300
                  text-xs font-medium
                  border border-white/[0.06] hover:border-white/[0.12]
                  transition-all duration-200"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </motion.button>
            )}
          </div>
        )}

        {/* Live mode execution indicator */}
        {mode === "live" && isRunning && (
          <div className="absolute top-4 right-4 z-10">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/15 text-emerald-400 text-xs font-medium backdrop-blur-sm"
            >
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Zap className="w-3 h-3" />
              </motion.div>
              Live Execution
            </motion.div>
          </div>
        )}
      </>
    );
  },
);

FlowControls.displayName = "FlowControls";
