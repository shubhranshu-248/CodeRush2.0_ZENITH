"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Activity } from "lucide-react";
import { TimelineItem, type ExecutionEvent } from "./timeline-item";

/* ── Props ── */
interface ExecutionTimelineProps {
  events?: ExecutionEvent[];
  className?: string;
  maxHeight?: string;
}

/* ── Main Component ── */
export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
  events = [],
  className = "",
  maxHeight = "420px",
}) => {
  /* Newest first */
  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [events]
  );

  const runningCount = sorted.filter((e) => e.status === "running").length;

  return (
    <div
      className={`flex flex-col rounded-xl bg-[#0d0e12]/80 backdrop-blur-md border border-white/[0.06] overflow-hidden ${className}`}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-gray-200 tracking-tight">
            Execution Timeline
          </span>
          {events.length > 0 && (
            <span className="text-[10px] text-gray-500 font-mono tabular-nums">
              {events.length} event{events.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {runningCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-950/40 border border-indigo-500/20"
          >
            <Activity className="w-3 h-3 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-medium text-indigo-300">
              {runningCount} active
            </span>
          </motion.div>
        )}
      </div>

      {/* ── Body ── */}
      <div
        className="overflow-y-auto px-4 pt-4 pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/[0.06] hover:scrollbar-thumb-white/[0.1]"
        style={{ maxHeight }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {sorted.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <Clock className="w-4 h-4 text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">No execution events</p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Events will appear here as the workflow runs
                </p>
              </div>
            </motion.div>
          ) : (
            sorted.map((event, i) => (
              <TimelineItem
                key={event.id}
                event={event}
                isLast={i === sorted.length - 1}
                index={i}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* Re-export types for consumers */
export type { ExecutionEvent, TimelineStatus } from "./timeline-item";
