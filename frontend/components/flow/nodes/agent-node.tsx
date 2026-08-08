"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Search,
  FileText,
  ShieldCheck,
  UserCheck,
  Pause,
  Clock,
  ChevronDown,
  ChevronUp,
  XCircle,
} from "lucide-react";

type ExecutionStatus = "idle" | "queued" | "running" | "completed" | "failed" | "waiting_approval";

interface AgentTheme {
  bg: string;
  icon: React.ReactNode;
  dot: string;
  glowRgb: string;
}

const getAgentTheme = (type: string): AgentTheme => {
  switch (type) {
    case "planner":
      return {
        bg: "bg-indigo-950/60 text-indigo-400 border-indigo-500/30",
        icon: <Sparkles className="w-3.5 h-3.5" />,
        dot: "bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]",
        glowRgb: "99,102,241",
      };
    case "researcher":
      return {
        bg: "bg-cyan-950/60 text-cyan-400 border-cyan-500/30",
        icon: <Search className="w-3.5 h-3.5" />,
        dot: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]",
        glowRgb: "6,182,212",
      };
    case "writer":
      return {
        bg: "bg-emerald-950/60 text-emerald-400 border-emerald-500/30",
        icon: <FileText className="w-3.5 h-3.5" />,
        dot: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
        glowRgb: "16,185,129",
      };
    case "verifier":
      return {
        bg: "bg-amber-950/60 text-amber-400 border-amber-500/30",
        icon: <ShieldCheck className="w-3.5 h-3.5" />,
        dot: "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
        glowRgb: "245,158,11",
      };
    case "approval":
      return {
        bg: "bg-rose-950/60 text-rose-400 border-rose-500/30",
        icon: <UserCheck className="w-3.5 h-3.5" />,
        dot: "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]",
        glowRgb: "244,63,94",
      };
    default:
      return {
        bg: "bg-gray-900/60 text-gray-400 border-white/[0.08]",
        icon: <Bot className="w-3.5 h-3.5" />,
        dot: "bg-gray-400",
        glowRgb: "156,163,175",
      };
  }
};

/* ── Status Badge ── */
const StatusBadge = ({ status }: { status: ExecutionStatus }) => {
  const config: Record<ExecutionStatus, { label: string; className: string } | null> = {
    idle: null,
    queued: { label: "Queued", className: "bg-zinc-800/80 text-zinc-400 border-zinc-600/30" },
    running: { label: "Running", className: "bg-indigo-950/80 text-indigo-300 border-indigo-500/40" },
    completed: { label: "Done", className: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" },
    failed: { label: "Failed", className: "bg-red-950/80 text-red-300 border-red-500/40" },
    waiting_approval: { label: "Awaiting", className: "bg-amber-950/80 text-amber-300 border-amber-500/40" },
  };

  const badge = config[status];
  if (!badge) return null;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
      className={`text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${badge.className}`}
    >
      {badge.label}
    </motion.span>
  );
};

/* ── Status Icon ── */
const StatusIcon = ({ status }: { status: ExecutionStatus }) => {
  switch (status) {
    case "running":
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-4 h-4 text-indigo-400" />
        </motion.div>
      );
    case "completed":
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -90 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.1 }}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
        </motion.div>
      );
    case "failed":
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 12 }}
        >
          <XCircle className="w-4 h-4 text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
        </motion.div>
      );
    case "waiting_approval":
      return (
        <motion.div
          animate={{ opacity: [1, 0.4, 1], scale: [1, 0.92, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Pause className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
        </motion.div>
      );
    case "queued":
      return (
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
        </motion.div>
      );
    default:
      return null;
  }
};

/* ── Duration Chip ── */
const DurationChip = ({ duration }: { duration?: number }) => {
  if (duration == null) return null;
  const formatted = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`;
  return (
    <motion.span
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="text-[9px] text-emerald-400/70 font-mono tabular-nums"
    >
      {formatted}
    </motion.span>
  );
};

/* ── Wrapper border style per status ── */
const getWrapperClasses = (status: ExecutionStatus): string => {
  const base = "relative px-4 py-3 rounded-2xl min-w-[210px] max-w-[260px] text-gray-100 backdrop-blur-md transition-all duration-300";

  switch (status) {
    case "idle":
      return `${base} bg-[#0d0e12]/90 border border-white/[0.08] shadow-lg shadow-black/20`;
    case "queued":
      return `${base} bg-[#0d0e12]/70 border border-dashed border-zinc-600/40 shadow-md opacity-80`;
    case "running":
      return `${base} bg-[#0d0e12]/95 border border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.2),0_0_80px_rgba(99,102,241,0.08)]`;
    case "completed":
      return `${base} bg-[#0d0e12]/95 border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15),0_0_60px_rgba(16,185,129,0.06)]`;
    case "failed":
      return `${base} bg-[#0d0e12]/95 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.12)]`;
    case "waiting_approval":
      return `${base} bg-[#0d0e12]/95 border border-amber-500/50 shadow-[0_0_24px_rgba(245,158,11,0.1)]`;
    default:
      return `${base} bg-[#0d0e12]/90 border border-white/[0.08] shadow-lg`;
  }
};

/* ── Animate helpers ── */
const getWrapperAnimation = (status: ExecutionStatus) => {
  switch (status) {
    case "failed":
      return { x: [0, -4, 4, -3, 3, -1, 1, 0] };
    case "running":
      return {
        boxShadow: [
          "0 0 20px rgba(99,102,241,0.08), 0 0 60px rgba(99,102,241,0.04)",
          "0 0 30px rgba(99,102,241,0.2), 0 0 80px rgba(99,102,241,0.08)",
          "0 0 20px rgba(99,102,241,0.08), 0 0 60px rgba(99,102,241,0.04)",
        ],
      };
    case "waiting_approval":
      return {
        boxShadow: [
          "0 0 15px rgba(245,158,11,0.06)",
          "0 0 28px rgba(245,158,11,0.15)",
          "0 0 15px rgba(245,158,11,0.06)",
        ],
      };
    default:
      return {};
  }
};

const getWrapperTransition = (status: ExecutionStatus) => {
  switch (status) {
    case "failed":
      return { duration: 0.5, ease: "easeInOut" as const };
    case "running":
      return { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const };
    case "waiting_approval":
      return { duration: 3, repeat: Infinity, ease: "easeInOut" as const };
    default:
      return { duration: 0.3 };
  }
};

/* ── Main Component ── */
export const AgentNode = memo(({ data }: NodeProps) => {
  const status = ((data?.status as string) || "idle") as ExecutionStatus;
  const agentType = (data?.agentType as string) || "agent";
  const duration = data?.duration as number | undefined;
  const error = data?.error as string | undefined;
  const [errorExpanded, setErrorExpanded] = useState(false);

  const theme = getAgentTheme(agentType);

  return (
    <motion.div
      className={getWrapperClasses(status)}
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        ...getWrapperAnimation(status),
      }}
      whileHover={{
        y: -4,
        scale: 1.03,
        boxShadow: `0 12px 40px rgba(${theme.glowRgb},0.15), 0 4px 16px rgba(0,0,0,0.3)`,
      }}
      transition={getWrapperTransition(status)}
    >
      {/* Running: outer breathing glow */}
      {status === "running" && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-indigo-500/8 -z-10"
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Completed: success ring burst */}
      <AnimatePresence>
        {status === "completed" && (
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-emerald-400/30 -z-10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.08, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Running: animated progress strip at top */}
      {status === "running" && (
        <div className="absolute top-0 left-3 right-3 h-[2px] overflow-hidden rounded-full">
          <motion.div
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-400/90 to-transparent rounded-full"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* Completed: soft glow at top — animated fill */}
      {status === "completed" && (
        <motion.div
          className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, #34d399, #10b981, transparent)" }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      )}

      {/* Failed: red stripe */}
      {status === "failed" && (
        <motion.div
          className="absolute top-0 left-3 right-3 h-[2px] rounded-full bg-red-500/60"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-indigo-500/80 !border-2 !border-[#0d0e12] !rounded-full !transition-all hover:!bg-indigo-400 hover:!shadow-[0_0_8px_rgba(99,102,241,0.6)]"
      />

      {/* Main row */}
      <div className="flex items-center space-x-2.5">
        <motion.div
          className={`p-2 rounded-xl border ${theme.bg}`}
          animate={
            status === "running"
              ? { scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }
              : status === "completed"
              ? { scale: [1, 1.12, 1] }
              : {}
          }
          transition={
            status === "running"
              ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
              : status === "completed"
              ? { duration: 0.4, ease: "easeOut" }
              : {}
          }
        >
          {theme.icon}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <motion.span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`}
              animate={
                status === "running"
                  ? { scale: [1, 1.8, 1], opacity: [1, 0.6, 1] }
                  : status === "completed"
                  ? { scale: 1, opacity: 1 }
                  : {}
              }
              transition={{
                duration: 1.2,
                repeat: status === "running" ? Infinity : 0,
              }}
            />
            <p className="text-[11px] font-bold truncate text-gray-100 leading-tight">
              {String(data?.label || "Agent Node")}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[10px] text-gray-500 capitalize tracking-wide font-medium">{agentType}</p>
            <StatusBadge status={status} />
            {status === "completed" && <DurationChip duration={duration} />}
          </div>
        </div>

        <div className="shrink-0 ml-1">
          <StatusIcon status={status} />
        </div>
      </div>

      {/* Failed: expandable error section */}
      <AnimatePresence>
        {status === "failed" && error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <button
              onClick={() => setErrorExpanded((prev) => !prev)}
              className="flex items-center gap-1 mt-2 w-full text-left text-[10px] text-red-400/80 hover:text-red-300 transition-colors"
            >
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span className="truncate flex-1">{errorExpanded ? "Hide error" : "Show error"}</span>
              {errorExpanded ? (
                <ChevronUp className="w-3 h-3 shrink-0" />
              ) : (
                <ChevronDown className="w-3 h-3 shrink-0" />
              )}
            </button>
            <AnimatePresence>
              {errorExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <p className="text-[10px] text-red-400/70 mt-1 leading-relaxed bg-red-950/30 rounded-lg px-2 py-1.5 border border-red-500/10 font-mono break-words max-w-[220px]">
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-indigo-500/80 !border-2 !border-[#0d0e12] !rounded-full !transition-all hover:!bg-indigo-400 hover:!shadow-[0_0_8px_rgba(99,102,241,0.6)]"
      />
    </motion.div>
  );
});

AgentNode.displayName = "AgentNode";
