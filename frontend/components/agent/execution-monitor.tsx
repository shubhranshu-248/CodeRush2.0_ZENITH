"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Activity, CheckCircle2, ShieldCheck, Zap, XCircle, Loader2, ChevronRight, ChevronDown, Cpu, Coins, Timer, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StepLog } from "@/types/agent";

export interface ExecutionMonitorProps {
  logs?: StepLog[];
  isStreaming?: boolean;
  elapsed?: number;
  progress?: number;
  error?: string | null;
  currentNode?: string | null;
  completedNodes?: string[];
  totalTokens?: number;
  totalCost?: number;
}

const formatElapsed = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
};

/** Map backend node names to display-friendly labels */
const nodeDisplayName: Record<string, string> = {
  planner: "Planner",
  parallel_research: "Research",
  join: "Join",
  writer: "Writer",
  verifier: "Verifier",
  approval: "Approval",
  final_output: "Output",
};

const getNodeLabel = (nodeId: string): string =>
  nodeDisplayName[nodeId] ?? nodeId;

/** Typed handoff label for output data */
const getHandoffType = (agentType: string): string => {
  switch (agentType) {
    case "planner": return "TaskPlan";
    case "parallel_research":
    case "researcher": return "ResearchFindings";
    case "writer": return "DraftDocument";
    case "verifier": return "VerificationResult";
    case "approval": return "ApprovalDecision";
    default: return "AgentOutput";
  }
};

/** Expandable log entry with typed handoff preview */
const LogEntry: React.FC<{ log: StepLog; index: number }> = ({ log, index }) => {
  const [expanded, setExpanded] = useState(false);
  const hasOutput = log.status === "completed" && log.outputs && Object.keys(log.outputs).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="space-y-0.5 group"
    >
      <div className="flex items-start gap-1.5 py-0.5 px-1.5 -mx-1.5 rounded-md hover:bg-white/[0.02] transition-colors">
        {statusIcon(log.status)}
        <span className="text-indigo-400 font-semibold">[{getNodeLabel(log.agentType)}]</span>
        <span className="text-gray-500">{getNodeLabel(log.nodeId)}</span>
        <span className={
          log.status === "completed"
            ? "text-emerald-400 font-medium"
            : log.status === "failed"
            ? "text-red-400 font-medium"
            : "text-gray-300"
        }>
          {log.status === "running" && "started"}
          {log.status === "completed" && "completed"}
          {log.status === "failed" && "failed"}
        </span>
        {hasOutput && (
          <button
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-0.5 text-[10px] text-indigo-400/60 hover:text-indigo-300 transition-colors ml-1"
          >
            <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronRight className="w-2.5 h-2.5" />
            </motion.span>
            <span className="font-mono">{getHandoffType(log.agentType)}</span>
          </button>
        )}
        <span className="text-gray-600/60 ml-auto shrink-0 tabular-nums">
          {new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false })}
        </span>
      </div>
      <AnimatePresence>
        {expanded && hasOutput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="ml-5 mt-0.5 p-2 rounded-lg bg-indigo-950/20 border border-indigo-500/10 text-[10px] font-mono text-gray-400 max-h-24 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/[0.06]">
              <div className="text-indigo-400/60 mb-1">→ {getHandoffType(log.agentType)} handoff:</div>
              <pre className="whitespace-pre-wrap break-words text-gray-300/80">
                {JSON.stringify(log.outputs, null, 2).slice(0, 500)}
                {JSON.stringify(log.outputs).length > 500 && "..."}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const statusIcon = (status: string) => {
  switch (status) {
    case "running":
      return <Loader2 className="w-3 h-3 text-indigo-400 animate-spin shrink-0 mt-0.5" />;
    case "completed":
      return <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />;
    case "failed":
      return <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />;
    default:
      return null;
  }
};

/** Animated progress bar */
const ProgressBar: React.FC<{ progress: number; isStreaming: boolean }> = ({ progress, isStreaming }) => (
  <div className="h-[3px] w-full bg-white/[0.04] rounded-full overflow-hidden">
    <motion.div
      className="h-full rounded-full relative"
      style={{
        background: progress >= 100
          ? "linear-gradient(90deg, #10b981, #34d399)"
          : "linear-gradient(90deg, #6366f1, #818cf8, #a5b4fc)",
      }}
      initial={{ width: "0%" }}
      animate={{ width: `${Math.max(progress, isStreaming ? 3 : 0)}%` }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {isStreaming && progress < 100 && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  </div>
);

/** Metric card */
const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.03] transition-all group">
    <div className="flex items-center gap-1.5 mb-1.5">
      {icon}
      <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{label}</span>
    </div>
    <span className={`font-mono text-sm font-bold ${color}`}>{value}</span>
  </div>
);

export const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({
  logs = [],
  isStreaming = false,
  elapsed = 0,
  progress = 0,
  error = null,
  currentNode = null,
  completedNodes = [],
  totalTokens = 0,
  totalCost = 0,
}) => {
  const [activeTab, setActiveTab] = useState<"logs" | "metrics">("logs");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  const statusBadge = () => {
    if (error) return <Badge variant="error" showDot>Error</Badge>;
    if (isStreaming) return <Badge variant="warning" showDot>Executing</Badge>;
    if (progress >= 100) return <Badge variant="success" showDot>Complete</Badge>;
    if (logs.some((l) => l.status === "completed")) return <Badge variant="success" showDot>Complete</Badge>;
    return <Badge variant="neutral" showDot>Idle</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-52 border-t border-white/[0.08] bg-[#0a0b0f]/95 backdrop-blur-xl p-3.5 flex flex-col z-10 sticky bottom-0"
    >
      {/* Progress bar at very top */}
      <ProgressBar progress={progress} isStreaming={isStreaming} />

      {/* Console Header & Tabs */}
      <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Terminal className="w-4 h-4 text-indigo-400" />
              {isStreaming && (
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
            <span className="text-xs font-semibold text-gray-200 tracking-tight">Execution Monitor</span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-0.5 bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.06]">
            {(["logs", "metrics"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === tab
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="monitor-tab"
                    className="absolute inset-0 bg-indigo-600/80 rounded-md shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab === "logs" ? "Console" : "Metrics"}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming && currentNode && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono bg-indigo-950/30 px-2 py-0.5 rounded-md border border-indigo-500/15"
            >
              <Zap className="w-3 h-3 animate-pulse" />
              {getNodeLabel(currentNode)}
            </motion.span>
          )}
          {statusBadge()}
        </div>
      </div>

      {/* Console Body */}
      {activeTab === "logs" ? (
        <div
          ref={scrollRef}
          className="flex-1 my-1.5 overflow-y-auto font-mono text-[11px] text-gray-300 space-y-0.5 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/[0.06]"
        >
          {logs.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-gray-600"
              >
                <Terminal className="w-6 h-6 mx-auto mb-2" />
              </motion.div>
              <p className="text-[11px] text-gray-500">Pipeline compiler ready</p>
              <p className="text-[10px] text-gray-600 mt-0.5">Generate a graph and execute to see live output</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              {logs.map((log, i) => (
                <LogEntry key={log.id} log={log} index={i} />
              ))}

              {/* Streaming indicator */}
              {isStreaming && logs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 py-1 text-gray-500"
                >
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="flex gap-0.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-indigo-400" />
                    <span className="w-1 h-1 rounded-full bg-indigo-400/70" />
                    <span className="w-1 h-1 rounded-full bg-indigo-400/40" />
                  </motion.span>
                  <span className="text-[10px]">awaiting next agent...</span>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 flex items-center gap-1.5 mt-1 px-1.5 py-1 rounded-md bg-red-950/20 border border-red-500/10"
                >
                  <XCircle className="w-3 h-3 shrink-0" />
                  <span className="font-semibold">[Error]</span>
                  <span className="text-red-400/80">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      ) : (
        <div className="flex-1 my-1.5 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/[0.06]">
          <div className="grid grid-cols-4 gap-2">
            <MetricCard
              icon={<Timer className="w-3 h-3 text-indigo-400" />}
              label="Elapsed"
              value={formatElapsed(elapsed)}
              color="text-indigo-400"
            />
            <MetricCard
              icon={<BarChart3 className="w-3 h-3 text-cyan-400" />}
              label="Progress"
              value={`${progress}%`}
              color="text-cyan-400"
            />
            <MetricCard
              icon={<Cpu className="w-3 h-3 text-emerald-400" />}
              label={totalTokens > 0 ? "Tokens" : "Est. Tokens"}
              value={totalTokens > 0 ? totalTokens.toLocaleString() : completedNodes.length > 0 ? `~${(completedNodes.length * 2800).toLocaleString()}` : "—"}
              color="text-emerald-400"
            />
            <MetricCard
              icon={<Coins className="w-3 h-3 text-amber-400" />}
              label={totalCost > 0 ? "Cost" : "Est. Cost"}
              value={totalCost > 0 ? `$${totalCost.toFixed(4)}` : completedNodes.length > 0 ? `$${(completedNodes.length * 0.018).toFixed(3)}` : "—"}
              color="text-amber-400"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs hover:border-white/[0.1] transition-colors">
              <span className="text-gray-500 text-[10px]">LLM Provider</span>
              <span className="font-mono text-emerald-400 font-semibold text-[11px]">Llama 3.3 70B</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs hover:border-white/[0.1] transition-colors">
              <span className="text-gray-500 text-[10px]">Checkpointer</span>
              <span className="font-mono text-cyan-400 font-semibold text-[11px]">SQLite Async</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs hover:border-white/[0.1] transition-colors">
              <span className="text-gray-500 text-[10px]">Steps</span>
              <span className="font-mono text-indigo-400 font-semibold text-[11px]">{completedNodes.length}/7</span>
            </div>
          </div>
        </div>
      )}

      {/* Console Footer */}
      <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1.5 border-t border-white/[0.06]">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isStreaming ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-gray-600"}`} />
          <span>SSE: {isStreaming ? <span className="text-emerald-400">Connected</span> : "Disconnected"}</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-indigo-500/60" />
            <span>Verification Active</span>
          </span>
          <span className="font-mono text-gray-600">v1.0.0</span>
        </span>
      </div>
    </motion.div>
  );
};
