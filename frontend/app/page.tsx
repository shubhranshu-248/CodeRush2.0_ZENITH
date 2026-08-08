"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowRight,
  Play,
  Search,
  Settings,
  Sparkles,
  GitBranch,
  Activity,
  Shield,
  RotateCcw,
  FileOutput,
  Brain,
  Eye,
  Cpu,
  Zap,
  Send,
  ChevronRight,
  Package,
  BookOpen,
  Lock,
  Scale,
  Globe,
  Server,
  BarChart3,
  Users,
  Terminal,
  Mic,
  Bot,
  Layers,
  CheckCircle2,
} from "lucide-react";

/* ================================================================== */
/*  PROCEDURAL BACKGROUND                                              */
/* ================================================================== */

const ProceduralBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight * 3);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight * 3;
    };
    window.addEventListener("resize", handleResize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
      hue: number;
      pulse: number;
      pulseSpeed: number;
    }

    const COUNT = Math.min(60, Math.floor((w * h) / 40000));
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.15 - 0.05,
      radius: Math.random() * 1.2 + 0.4,
      opacity: Math.random() * 0.3 + 0.08,
      hue: 145 + Math.random() * 20,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.006 + Math.random() * 0.012,
    }));

    interface Orb {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      opacity: number;
    }

    const orbs: Orb[] = [
      { x: w * 0.15, y: h * 0.1, radius: 250, vx: 0.12, vy: 0.06, opacity: 0.02 },
      { x: w * 0.75, y: h * 0.05, radius: 300, vx: -0.08, vy: 0.04, opacity: 0.015 },
      { x: w * 0.5, y: h * 0.3, radius: 220, vx: 0.06, vy: -0.08, opacity: 0.012 },
    ];

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.radius || orb.x > w + orb.radius) orb.vx *= -1;
        if (orb.y < -orb.radius || orb.y > h + orb.radius) orb.vy *= -1;
        const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        g.addColorStop(0, `rgba(16, 185, 129, ${orb.opacity})`);
        g.addColorStop(0.5, `rgba(16, 185, 129, ${orb.opacity * 0.3})`);
        g.addColorStop(1, "rgba(16, 185, 129, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(orb.x - orb.radius, orb.y - orb.radius, orb.radius * 2, orb.radius * 2);
      }

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const op = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
        const r = p.radius * (0.8 + 0.2 * Math.sin(p.pulse * 0.7));

        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 55%, ${op * 0.12})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${op})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - dist / 100) * 0.05})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

/* ================================================================== */
/*  REVEAL WRAPPER                                                     */
/* ================================================================== */

const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ================================================================== */
/*  CONSOLE OUTPUT PANEL (Hero right side)                             */
/* ================================================================== */

const ConsolePanel: React.FC = () => {
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [activeLoad, setActiveLoad] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => {
      setTasksCompleted((p) => (p >= 100 ? 0 : p + 1));
    }, 80);
    const t2 = setInterval(() => {
      setActiveLoad((p) => {
        const next = p + (Math.random() - 0.3) * 5;
        return Math.max(0, Math.min(45, next));
      });
    }, 300);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  const pipelineStages = [
    { label: "Parse", progress: 100, color: "bg-emerald-500" },
    { label: "Plan", progress: 100, color: "bg-emerald-500" },
    { label: "Execute", progress: 72, color: "bg-emerald-400" },
    { label: "Verify", progress: 0, color: "bg-neutral-700" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-[480px]"
    >
      {/* Ambient glow */}
      <div className="absolute -inset-6 bg-emerald-500/[0.04] rounded-3xl blur-2xl pointer-events-none" />

      <div className="relative bg-[#0c0e14]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[13px] font-semibold text-neutral-200 tracking-tight">
              CONSOLE OUTPUT
            </span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Master Orchestrator + System Health */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0b10] border border-white/[0.06] rounded-xl p-4">
              <h4 className="text-[13px] font-semibold text-neutral-200 mb-1">
                Nexora Orchestrator
              </h4>
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-wider">
                  Active Pipeline
                </span>
              </div>
            </div>

            <div className="bg-[#0a0b10] border border-white/[0.06] rounded-xl p-4">
              <h4 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                System Health
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">Tasks</span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {tasksCompleted}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">Load</span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {activeLoad.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline Progress */}
          <div className="flex gap-2">
            {pipelineStages.map((stage) => (
              <div key={stage.label} className="flex-1">
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden mb-1">
                  <motion.div
                    className={`h-full rounded-full ${stage.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.progress}%` }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[9px] text-neutral-600 font-mono">{stage.label}</span>
              </div>
            ))}
          </div>

          {/* Flow Logic + Routing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0b10] border border-white/[0.06] rounded-xl p-3">
              <h4 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Flow Logic
              </h4>
              <div className="flex items-center gap-2">
                {[Brain, ChevronRight, Layers, ChevronRight, Zap].map(
                  (Icon, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 + i * 0.15 }}
                    >
                      {i % 2 === 1 ? (
                        <ChevronRight className="w-3 h-3 text-neutral-700" />
                      ) : (
                        <Icon className="w-4 h-4 text-emerald-400/60" />
                      )}
                    </motion.div>
                  )
                )}
              </div>
            </div>

            <div className="bg-[#0a0b10] border border-white/[0.06] rounded-xl p-3">
              <h4 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Routing Network
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-neutral-600 block">Uptime</span>
                  <span className="text-[15px] font-semibold text-neutral-200">99.9%</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-neutral-600 block">Latency</span>
                  <span className="text-[15px] font-semibold text-emerald-400">14ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ================================================================== */
/*  CHAT INPUT BAR                                                     */
/* ================================================================== */

const ChatInputBar: React.FC = () => {
  const [focused, setFocused] = useState(false);
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    router.push(`/workspace?goal=${encodeURIComponent(trimmed)}`);
  }, [input, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <Reveal>
      <div className="max-w-3xl mx-auto px-6">
        <div
          className={`relative bg-[#0c0e14]/80 backdrop-blur-xl border rounded-2xl transition-all duration-300 shadow-2xl shadow-black/30 ${
            focused
              ? "border-emerald-500/30 shadow-emerald-500/5"
              : "border-white/[0.08]"
          }`}
        >
          <div className="px-5 py-4">
            <input
              type="text"
              placeholder="Message Nexora Agent..."
              className="w-full bg-transparent text-[15px] text-neutral-200 placeholder-neutral-600 outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex items-center justify-between px-5 pb-4">
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] transition-all">
                <Mic className="w-3.5 h-3.5" />
              </button>
              {[
                { icon: Globe, label: "Search" },
                { icon: Brain, label: "Reason", active: true },
                { icon: Settings, label: "Configure" },
              ].map((item) => (
                <button
                  key={item.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all ${
                    item.active
                      ? "bg-emerald-500/[0.1] text-emerald-400 border border-emerald-500/[0.2]"
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                input.trim()
                  ? "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20 cursor-pointer"
                  : "bg-emerald-500/30 shadow-none cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4 text-[#08090a]" />
            </button>
          </div>
        </div>
      </div>
    </Reveal>
  );
};

/* ================================================================== */
/*  AGENT CARDS                                                        */
/* ================================================================== */

interface AgentCard {
  name: string;
  greeting: string;
  color: string;
  swarm: string;
  presets: { label: string; highlight?: boolean }[];
}

const AGENTS: AgentCard[] = [
  {
    name: "Planner",
    greeting: "What's the mission?",
    color: "text-emerald-400",
    swarm: "CORESWARM",
    presets: [
      { label: "Decompose complex goal" },
      { label: "Design agent pipeline" },
      { label: "Optimize task routing" },
    ],
  },
  {
    name: "Researcher",
    greeting: "Ready to investigate.",
    color: "text-cyan-400",
    swarm: "INTELSWARM",
    presets: [
      { label: "Deep web research" },
      { label: "Competitive analysis", highlight: true },
      { label: "Data gathering" },
    ],
  },
  {
    name: "Analyst",
    greeting: "Crunching the data.",
    color: "text-violet-400",
    swarm: "DATASWARM",
    presets: [
      { label: "Trend analysis" },
      { label: "Pattern recognition" },
      { label: "Statistical modeling" },
    ],
  },
  {
    name: "Writer",
    greeting: "Words are my forge.",
    color: "text-amber-400",
    swarm: "MUSESWARM",
    presets: [
      { label: "Technical brief" },
      { label: "Executive summary" },
      { label: "Documentation", highlight: true },
    ],
  },
  {
    name: "Reviewer",
    greeting: "Verifying integrity.",
    color: "text-rose-400",
    swarm: "GUARDSWARM",
    presets: [
      { label: "Fact-check output" },
      { label: "Quality audit", highlight: true },
      { label: "Compliance review" },
    ],
  },
  {
    name: "Deployer",
    greeting: "Ship it.",
    color: "text-teal-400",
    swarm: "OPSSWARM",
    presets: [
      { label: "Export Markdown" },
      { label: "Generate PDF" },
      { label: "API integration" },
    ],
  },
];

const AgentCardComponent: React.FC<{ agent: AgentCard; index: number }> = ({
  agent,
  index,
}) => {
  return (
    <Reveal delay={index * 0.06}>
      <div className="group bg-[#0c0e14]/80 backdrop-blur-md border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] hover:bg-[#0e1018]/90 transition-all duration-300 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[17px] font-semibold text-neutral-200">
              Hello,{" "}
              <span className={agent.color}>{agent.name}</span>
            </h3>
            <p className="text-[12px] text-neutral-500 mt-0.5">{agent.greeting}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.3,
              }}
            />
            <span className="text-[10px] font-mono text-neutral-600 uppercase">
              Idle
            </span>
          </div>
        </div>

        {/* Preset tasks */}
        <div className="flex-1 space-y-1.5">
          {agent.presets.map((preset) => (
            <div
              key={preset.label}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] transition-all cursor-default ${
                preset.highlight
                  ? "bg-emerald-500/[0.06] border border-emerald-500/[0.1] text-emerald-300/80"
                  : "bg-white/[0.02] border border-white/[0.04] text-neutral-400 hover:bg-white/[0.04] hover:border-white/[0.08]"
              }`}
            >
              <span className={`text-[11px] ${preset.highlight ? "text-emerald-400" : "text-neutral-600"}`}>
                +
              </span>
              {preset.label}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
          <span className="text-[11px] text-neutral-600">
            Type @ to view configs...
          </span>
          <span className="text-[10px] font-mono text-emerald-400/40 tracking-wider">
            ACTIVE &apos;{agent.swarm}&apos;
          </span>
        </div>
      </div>
    </Reveal>
  );
};

/* ================================================================== */
/*  AGGREGATED DELIVERY SECTION                                        */
/* ================================================================== */

const AggregatedDelivery: React.FC = () => {
  return (
    <Reveal>
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-[#0c0e14]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
            <Package className="w-4 h-4 text-emerald-400/60" />
            <span className="text-[14px] font-semibold text-neutral-200">
              Aggregated Pipeline Delivery
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/[0.1] text-amber-400/80 border border-amber-500/[0.15]">
              PENDING
            </span>
          </div>

          {/* Content */}
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
            <Package className="w-8 h-8 text-neutral-700 mb-4" />
            <p className="text-[14px] text-neutral-500 italic">
              Awaiting pipeline synthesis output...
            </p>
            <p className="text-[12px] text-neutral-600 mt-1">
              Select any preset task above to kick off compilation.
            </p>

            <Link
              href="/workspace"
              className="mt-6 group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/[0.1] hover:bg-emerald-500/[0.15] border border-emerald-500/[0.2] text-[13px] text-emerald-400 hover:text-emerald-300 transition-all"
            >
              Open Workspace
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
};

/* ================================================================== */
/*  CORE CAPABILITIES SECTION                                          */
/* ================================================================== */

const CAPABILITIES = [
  {
    icon: Activity,
    title: "Real-Time Execution Engine",
    description:
      "LangGraph state machines with async checkpointing. Watch agents execute in real time via Server-Sent Events.",
  },
  {
    icon: Eye,
    title: "Full Observability",
    description:
      "Interactive DAG visualization with React Flow. Click any node to inspect model, tokens, cost, and output.",
  },
  {
    icon: Shield,
    title: "Human-in-the-Loop Gates",
    description:
      "Approval checkpoints pause the pipeline at critical steps. Review, approve, or reject before continuing.",
  },
  {
    icon: RotateCcw,
    title: "Execution Replay",
    description:
      "Step through any past run frame by frame. Full transport controls — play, pause, step, speed adjustment.",
  },
  {
    icon: Settings,
    title: "Per-Agent Configuration",
    description:
      "Change model, temperature, and token budget on any agent node. Changes apply instantly without rebuilding.",
  },
  {
    icon: FileOutput,
    title: "Multi-Format Export",
    description:
      "Export final outputs as Markdown or PDF. Preview with syntax highlighting, copy to clipboard, or download.",
  },
] as const;

/* ================================================================== */
/*  MAIN PAGE                                                          */
/* ================================================================== */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08090a] text-neutral-100 selection:bg-emerald-500/20 selection:text-white overflow-x-hidden">
      <ProceduralBackground />

      {/* ──────────────── NAV ──────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6 bg-[#08090a]/70 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <Image src="/nexora-logo.png" alt="Nexora" width={28} height={28} className="rounded-lg" />
          <span className="text-sm font-bold tracking-tight text-neutral-200">
            NEXORA
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[13px] text-neutral-500">
          <a href="#" className="text-neutral-200 transition-colors">
            Home
          </a>
          <a href="#capabilities" className="hover:text-neutral-200 transition-colors">
            Features
          </a>
          <Link href="/workspace" className="hover:text-neutral-200 transition-colors">
            Agent Console
          </Link>
          <Link href="/dashboard" className="hover:text-neutral-200 transition-colors">
            Docs
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[13px] text-neutral-500 hover:text-neutral-200 transition-colors cursor-default">
            Login
          </span>
          <Link
            href="/workspace"
            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[13px] font-semibold text-[#08090a] transition-all shadow-lg shadow-emerald-500/20"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ──────────────── HERO — SPLIT ──────────────── */}
      <section className="relative min-h-screen flex items-center pt-14">
        {/* Nexora background logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="relative w-[700px] h-[700px] opacity-[0.06]">
            <Image src="/nexora-logo.jpg" alt="" fill className="object-contain" />
          </div>
        </div>
        {/* Ambient washes */}
        <div className="absolute top-10 left-[10%] w-[500px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-32 right-[15%] w-[400px] h-[300px] bg-emerald-600/[0.02] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT — Text */}
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase text-emerald-400/80 bg-emerald-500/[0.08] border border-emerald-500/[0.12]">
                Next-Generation AI Orchestration
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 text-[clamp(2.4rem,5.5vw,3.8rem)] font-bold leading-[1.06] tracking-[-0.04em] text-white"
            >
              Empowering the
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
                Autonomous
              </span>{" "}
              Era
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 text-[clamp(0.95rem,1.6vw,1.1rem)] leading-relaxed text-neutral-400 max-w-md"
            >
              Architect, orchestrate, and deploy hyper-intelligent, context-aware
              AI agents for complex business workflows and autonomous systems.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/workspace"
                className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#08090a] text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30"
              >
                Launch Your First Agent
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/[0.08] hover:border-white/[0.15] text-sm text-neutral-400 hover:text-neutral-200 transition-all bg-white/[0.02] hover:bg-white/[0.04]"
              >
                Explore Documentation
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* RIGHT — Console Panel */}
          <div className="hidden lg:flex justify-center">
            <ConsolePanel />
          </div>
        </div>
      </section>

      {/* ──────────────── CHAT INPUT ──────────────── */}
      <section className="relative z-10 -mt-8 mb-20">
        <ChatInputBar />
      </section>

      {/* ──────────────── CORE CAPABILITIES ──────────────── */}
      <section id="capabilities" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase text-emerald-400/80 bg-emerald-500/[0.06] border border-emerald-500/[0.1]">
              Core Capabilities
            </span>
            <h2 className="mt-5 text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold tracking-[-0.03em] text-neutral-100">
              Built for scale, designed for simplicity.
            </h2>
            <p className="mt-3 text-neutral-500 max-w-xl mx-auto text-[15px]">
              Nexora provides the enterprise infrastructure for self-improving
              agent workflows, observable execution, and human oversight.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAPABILITIES.map((cap, i) => (
              <Reveal key={cap.title} delay={i * 0.06}>
                <div className="bg-[#0c0e14]/60 backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.12] hover:bg-[#0e1018]/80 transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/[0.1] flex items-center justify-center mb-4">
                    <cap.icon className="w-5 h-5 text-emerald-400/70" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-neutral-200 mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-neutral-500">
                    {cap.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── ACTIVE AGENT NETWORK ──────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase text-emerald-400/80 bg-emerald-500/[0.06] border border-emerald-500/[0.1]">
              Active Agent Network
            </span>
            <h2 className="mt-5 text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold tracking-[-0.03em] text-neutral-100">
              Distributed Intelligence Swarm
            </h2>
            <p className="mt-3 text-neutral-500 max-w-lg mx-auto text-[15px]">
              Each agent is a specialized unit in your pipeline — assign tasks,
              configure models, and watch them collaborate autonomously.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENTS.map((agent, i) => (
              <AgentCardComponent key={agent.name} agent={agent} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── AGGREGATED DELIVERY ──────────────── */}
      <section className="relative z-10 py-16 px-6">
        <AggregatedDelivery />
      </section>

      {/* ──────────────── ENTERPRISE FOOTER ──────────────── */}
      <footer className="relative z-10 border-t border-white/[0.06] mt-16">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/nexora-logo.png" alt="Nexora" width={28} height={28} className="rounded-lg" />
                <span className="text-sm font-bold tracking-tight text-neutral-200">
                  NEXORA
                </span>
              </div>
              <p className="text-[12px] text-neutral-500 leading-relaxed mb-4 max-w-[220px]">
                The unified orchestration platform for multi-agent pipelines.
                Architect, verify, and scale autonomous workflows.
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-emerald-400/70 font-medium uppercase tracking-wider">
                  All Systems Operational
                </span>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5">
                {["Agent Console", "Workflow Builder", "Agent Registry", "Metrics & Analytics"].map(
                  (item) => (
                    <li key={item}>
                      <Link
                        href="/workspace"
                        className="text-[13px] text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-4">
                Resources
              </h4>
              <ul className="space-y-2.5">
                {["API Documentation", "System Guides", "SDK Libraries", "Developer Forums"].map(
                  (item) => (
                    <li key={item}>
                      <Link
                        href="/dashboard"
                        className="text-[13px] text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Security */}
            <div>
              <h4 className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-4">
                Security
              </h4>
              <ul className="space-y-2.5">
                {["Security Center", "Trust Portal", "Audit Logs", "Compliance"].map(
                  (item) => (
                    <li key={item}>
                      <span className="text-[13px] text-neutral-500 hover:text-neutral-300 transition-colors cursor-default">
                        {item}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5">
                {["Terms of Service", "Privacy Policy", "Acceptable Use", "GDPR Info"].map(
                  (item) => (
                    <li key={item}>
                      <span className="text-[13px] text-neutral-500 hover:text-neutral-300 transition-colors cursor-default">
                        {item}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.04] px-6 py-5">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[12px] text-neutral-600">
              © 2026 Nexora. All rights reserved. Built for Zenith Hackathon — AE-03.
            </span>
            <span className="text-[12px] text-neutral-600">
              Powered by{" "}
              <span className="text-emerald-400/60">Groq + Llama</span>
              {" & "}
              <span className="text-emerald-400/60">Next.js</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
