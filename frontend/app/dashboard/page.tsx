"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Plus,
  ArrowRight,
  ArrowLeft,
  Clock,
  Activity,
  BarChart3,
  Bot,
  DollarSign,
  Calendar,
  Inbox,
  LayoutDashboard,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface RunSummary {
  id: string;
  goal: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  agent_count: number;
  duration_ms: number;
  cost: number;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Mock data (fallback until backend endpoint is live)                */
/* ------------------------------------------------------------------ */

const MOCK_RUNS: RunSummary[] = [
  {
    id: "run_8f2a1c",
    goal: "Research competitor pricing across the top 10 SaaS analytics tools and summarize findings",
    status: "COMPLETED",
    agent_count: 5,
    duration_ms: 128_400,
    cost: 0.42,
    created_at: "2026-08-06T14:32:00Z",
  },
  {
    id: "run_3d9b7e",
    goal: "Draft a Q3 investor update from the latest revenue and churn metrics",
    status: "COMPLETED",
    agent_count: 3,
    duration_ms: 64_200,
    cost: 0.18,
    created_at: "2026-08-06T09:14:00Z",
  },
  {
    id: "run_1a4f6d",
    goal: "Audit the onboarding funnel for drop-off points and propose UX fixes",
    status: "RUNNING",
    agent_count: 6,
    duration_ms: 41_900,
    cost: 0.11,
    created_at: "2026-08-05T18:02:00Z",
  },
  {
    id: "run_9c0e2b",
    goal: "Generate a technical design doc for the new webhook retry system",
    status: "FAILED",
    agent_count: 4,
    duration_ms: 22_750,
    cost: 0.07,
    created_at: "2026-08-05T11:47:00Z",
  },
  {
    id: "run_5b8a3f",
    goal: "Summarize customer support tickets from the last 7 days into themes",
    status: "COMPLETED",
    agent_count: 2,
    duration_ms: 38_600,
    cost: 0.09,
    created_at: "2026-08-04T16:20:00Z",
  },
  {
    id: "run_2e7d4c",
    goal: "Plan a content calendar for the next product launch cycle",
    status: "PENDING",
    agent_count: 3,
    duration_ms: 0,
    cost: 0,
    created_at: "2026-08-04T08:55:00Z",
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatDuration(ms: number): string {
  if (!ms) return "—";
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remSeconds}s`;
}

function formatCost(cost: number): string {
  if (!cost) return "$0.00";
  return `$${cost.toFixed(2)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " · " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusVariant(status: RunSummary["status"]): "success" | "warning" | "error" | "neutral" {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "RUNNING":
      return "warning";
    case "FAILED":
      return "error";
    default:
      return "neutral";
  }
}

function truncateGoal(goal: string, max = 72): string {
  if (goal.length <= max) return goal;
  return goal.slice(0, max).trimEnd() + "…";
}

/* ------------------------------------------------------------------ */
/* Skeleton row                                                       */
/* ------------------------------------------------------------------ */

const SkeletonRow: React.FC<{ delay: number }> = ({ delay }) => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3, delay }}
    className="border-b border-white/[0.04]"
  >
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden relative">
          <div
            className="h-full w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-[shimmer_1.6s_infinite]"
            style={{ backgroundSize: "200% 100%" }}
          />
        </div>
      </td>
    ))}
  </motion.tr>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usedMock, setUsedMock] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRuns() {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/runs`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        const parsed: RunSummary[] = Array.isArray(data) ? data : data.runs ?? [];
        if (!cancelled) {
          setRuns(parsed);
          setUsedMock(false);
        }
      } catch {
        // Backend not ready yet — fall back to mock data for demo purposes
        if (!cancelled) {
          await new Promise((resolve) => setTimeout(resolve, 650));
          setRuns(MOCK_RUNS);
          setUsedMock(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadRuns();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = runs.length;
    const completed = runs.filter((r) => r.status === "COMPLETED").length;
    const totalCost = runs.reduce((sum, r) => sum + (r.cost || 0), 0);
    const avgAgents =
      total > 0 ? runs.reduce((sum, r) => sum + r.agent_count, 0) / total : 0;
    return { total, completed, totalCost, avgAgents };
  }, [runs]);

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 selection:bg-indigo-500/30">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.07] blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.05] blur-[120px]" />
      </div>

      {/* Header / Nav */}
      <header className="relative z-20 h-14 border-b border-white/[0.06] bg-[#08090a]/95 backdrop-blur-xl px-5 flex items-center justify-between sticky top-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/workspace")}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded-md hover:bg-white/[0.04]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-3 pl-4 border-l border-white/[0.06]">
            <motion.div
              className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold border border-indigo-400/30"
              animate={{ boxShadow: "0 0 15px rgba(99,102,241,0.5)" }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-gray-100 tracking-tight">ForgeAI</h1>
                <Badge variant="info" showDot={false} className="py-0 text-[10px]">
                  <LayoutDashboard className="w-2.5 h-2.5" />
                  Dashboard
                </Badge>
              </div>
              <p className="text-[10px] text-gray-500 font-medium tracking-wide">
                Workflow Run History
              </p>
            </div>
          </div>
        </div>

        <Button variant="primary" size="sm" onClick={() => router.push("/workspace")}>
          <Plus className="w-3.5 h-3.5" />
          <span>New Workflow</span>
        </Button>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Page intro */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-100 tracking-tight">Past Runs</h2>
          <p className="text-sm text-gray-500 mt-1">
            Review previously executed agent workflows, their outcomes, and costs.
          </p>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {[
            {
              label: "Total Runs",
              value: stats.total.toString(),
              icon: Activity,
              color: "text-indigo-400",
            },
            {
              label: "Completed",
              value: stats.completed.toString(),
              icon: BarChart3,
              color: "text-emerald-400",
            },
            {
              label: "Avg. Agents",
              value: stats.avgAgents.toFixed(1),
              icon: Bot,
              color: "text-cyan-400",
            },
            {
              label: "Total Cost",
              value: formatCost(stats.totalCost),
              icon: DollarSign,
              color: "text-amber-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#0d0e12]/80 border border-white/[0.06] backdrop-blur-md rounded-2xl px-4 py-3.5"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span className="text-[11px] text-gray-500 font-medium tracking-wide">
                  {stat.label}
                </span>
              </div>
              <div className="text-lg font-semibold text-gray-100 tabular-nums">
                {stat.value}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Table panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="bg-[#0d0e12]/80 border border-white/[0.06] backdrop-blur-md rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-medium text-gray-300">Recent Executions</span>
            </div>
            {usedMock && !isLoading && (
              <span className="text-[10px] text-gray-600 font-mono">
                showing demo data · live endpoint pending
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-2.5 text-[11px] font-medium text-gray-500 tracking-wide uppercase">
                    Goal
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-gray-500 tracking-wide uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-gray-500 tracking-wide uppercase">
                    Agents
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-gray-500 tracking-wide uppercase">
                    Duration
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-gray-500 tracking-wide uppercase">
                    Cost
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-gray-500 tracking-wide uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <SkeletonRow key={i} delay={i * 0.05} />
                    ))}
                  </>
                )}

                {!isLoading && runs.length > 0 && (
                  <AnimatePresence>
                    {runs.map((run, index) => (
                      <motion.tr
                        key={run.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04 }}
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
                        onClick={() => router.push("/workspace")}
                        className="group border-b border-white/[0.04] last:border-b-0 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3.5 max-w-[320px]">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-200 truncate">
                              {truncateGoal(run.goal)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={statusVariant(run.status)}>
                            {run.status.charAt(0) + run.status.slice(1).toLowerCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-300 tabular-nums">
                            <Bot className="w-3.5 h-3.5 text-gray-600" />
                            {run.agent_count}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-400 font-mono tabular-nums">
                            {formatDuration(run.duration_ms)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-400 font-mono tabular-nums">
                            {formatCost(run.cost)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar className="w-3 h-3 text-gray-600" />
                            {formatDate(run.created_at)}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>

            {/* Empty state */}
            {!isLoading && runs.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center py-16 px-6"
              >
                <motion.div
                  className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4"
                  animate={{
                    boxShadow: [
                      "0 0 0px rgba(99,102,241,0)",
                      "0 0 20px rgba(99,102,241,0.25)",
                      "0 0 0px rgba(99,102,241,0)",
                    ],
                  }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Inbox className="w-6 h-6 text-gray-500" />
                </motion.div>
                <h3 className="text-sm font-medium text-gray-300 mb-1">No workflow runs yet</h3>
                <p className="text-xs text-gray-500 max-w-sm text-center mb-5">
                  Once you execute a workflow, its history and metrics will show up here.
                </p>
                <Button variant="primary" size="sm" onClick={() => router.push("/workspace")}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start a Workflow</span>
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
