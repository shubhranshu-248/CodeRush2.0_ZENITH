"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Pause,
  Clock,
} from "lucide-react";

/* ── Types ── */
export type TimelineStatus = "running" | "completed" | "failed" | "approval" | "queued";

export interface ExecutionEvent {
  id: string;
  timestamp: string;
  nodeName: string;
  status: TimelineStatus;
  duration?: number;
}

/* ── Status Config ── */
const statusConfig: Record<
  TimelineStatus,
  {
    label: string;
    dotClass: string;
    lineClass: string;
    textClass: string;
    bgClass: string;
  }
> = {
  running: {
    label: "Running",
    dotClass: "border-indigo-500 bg-indigo-500/20",
    lineClass: "bg-indigo-500/30",
    textClass: "text-indigo-400",
    bgClass: "bg-indigo-950/30 border-indigo-500/20",
  },
  completed: {
    label: "Completed",
    dotClass: "border-emerald-500 bg-emerald-500/20",
    lineClass: "bg-emerald-500/20",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-950/20 border-emerald-500/15",
  },
  failed: {
    label: "Failed",
    dotClass: "border-red-500 bg-red-500/20",
    lineClass: "bg-red-500/20",
    textClass: "text-red-400",
    bgClass: "bg-red-950/20 border-red-500/15",
  },
  approval: {
    label: "Awaiting Approval",
    dotClass: "border-amber-500 bg-amber-500/20",
    lineClass: "bg-amber-500/20",
    textClass: "text-amber-400",
    bgClass: "bg-amber-950/20 border-amber-500/15",
  },
  queued: {
    label: "Queued",
    dotClass: "border-zinc-500 bg-zinc-500/20",
    lineClass: "bg-zinc-600/20",
    textClass: "text-zinc-400",
    bgClass: "bg-zinc-900/30 border-zinc-600/15",
  },
};

/* ── Status Icon ── */
const StatusIcon = ({ status }: { status: TimelineStatus }) => {
  switch (status) {
    case "running":
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-3.5 h-3.5 text-indigo-400" />
        </motion.div>
      );
    case "completed":
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </motion.div>
      );
    case "failed":
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 12 }}
        >
          <XCircle className="w-3.5 h-3.5 text-red-400" />
        </motion.div>
      );
    case "approval":
      return (
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Pause className="w-3.5 h-3.5 text-amber-400" />
        </motion.div>
      );
    case "queued":
      return <Clock className="w-3 h-3 text-zinc-500" />;
  }
};

/* ── Duration Chip ── */
const DurationChip = ({ duration }: { duration: number }) => {
  const formatted = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono tabular-nums text-gray-400">
      {formatted}
    </span>
  );
};

/* ── Timestamp formatter ── */
const formatTimestamp = (ts: string): string => {
  try {
    const date = new Date(ts);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return ts;
  }
};

/* ── TimelineItem ── */
interface TimelineItemProps {
  event: ExecutionEvent;
  isLast: boolean;
  index: number;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  event,
  isLast,
  index,
}) => {
  const config = statusConfig[event.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12, height: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.04,
        layout: { duration: 0.25 },
      }}
      className="relative flex gap-3 group"
    >
      {/* ── Vertical track ── */}
      <div className="relative flex flex-col items-center pt-0.5">
        {/* Dot */}
        <motion.div
          className={`relative z-10 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${config.dotClass}`}
          animate={
            event.status === "running"
              ? {
                  boxShadow: [
                    "0 0 0 0 rgba(99,102,241,0)",
                    "0 0 0 6px rgba(99,102,241,0.15)",
                    "0 0 0 0 rgba(99,102,241,0)",
                  ],
                }
              : event.status === "approval"
              ? {
                  boxShadow: [
                    "0 0 0 0 rgba(245,158,11,0)",
                    "0 0 0 6px rgba(245,158,11,0.12)",
                    "0 0 0 0 rgba(245,158,11,0)",
                  ],
                }
              : {}
          }
          transition={
            event.status === "running" || event.status === "approval"
              ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          <div className="w-[7px] h-[7px] rounded-full bg-current" style={{ color: `var(--dot-color)` }}>
            {/* Inner fill uses border color inheritance */}
          </div>
          <div
            className={`absolute w-[7px] h-[7px] rounded-full ${
              event.status === "running"
                ? "bg-indigo-400"
                : event.status === "completed"
                ? "bg-emerald-400"
                : event.status === "failed"
                ? "bg-red-400"
                : event.status === "approval"
                ? "bg-amber-400"
                : "bg-zinc-500"
            }`}
          />
        </motion.div>

        {/* Connector line */}
        {!isLast && (
          <div className={`w-[1.5px] flex-1 min-h-[20px] mt-1 ${config.lineClass}`} />
        )}
      </div>

      {/* ── Content card ── */}
      <div className="flex-1 pb-4 min-w-0">
        <motion.div
          className={`rounded-xl border px-3 py-2.5 ${config.bgClass} transition-colors`}
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.15 }}
        >
          {/* Row 1: node name + status icon */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <StatusIcon status={event.status} />
              <span className="text-[13px] font-semibold text-gray-100 truncate">
                {event.nodeName}
              </span>
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 ${config.textClass}`}
            >
              {config.label}
            </span>
          </div>

          {/* Row 2: timestamp + duration */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-mono text-gray-500 tabular-nums">
              {formatTimestamp(event.timestamp)}
            </span>
            {event.duration != null && <DurationChip duration={event.duration} />}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
