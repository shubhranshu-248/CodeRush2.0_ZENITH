"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cpu, Clock, Coins, Wrench, Thermometer, Hash, Check } from "lucide-react";

export interface AgentConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
  nodeData: Record<string, unknown> | null;
}

/** Per-agent default configs for demo display */
const AGENT_CONFIGS: Record<string, {
  model: string;
  fallback: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  budget: string;
  tools: string[];
  role: string;
}> = {
  planner: { model: "gemini-3.5-flash", fallback: "gemini-3.5-flash-lite", temperature: 0.3, maxTokens: 4096, timeout: 30, budget: "$0.05", tools: ["goal_parser", "graph_compiler"], role: "Decomposes goal into subtasks, assigns agents, builds execution DAG" },
  researcher: { model: "gemini-3.5-flash", fallback: "gemini-3.5-flash-lite", temperature: 0.5, maxTokens: 8192, timeout: 60, budget: "$0.10", tools: ["web_search", "doc_retrieval", "summarizer"], role: "Gathers information from multiple sources, synthesizes findings" },
  writer: { model: "gemini-3.5-flash", fallback: "gemini-3.5-flash-lite", temperature: 0.7, maxTokens: 16384, timeout: 45, budget: "$0.08", tools: ["text_generator", "citation_formatter"], role: "Produces structured output from research findings with citations" },
  verifier: { model: "gemini-3.5-flash", fallback: "gemini-3.5-flash-lite", temperature: 0.1, maxTokens: 4096, timeout: 30, budget: "$0.04", tools: ["fact_checker", "consistency_validator"], role: "Validates accuracy, checks for hallucinations and inconsistencies" },
  approval: { model: "—", fallback: "—", temperature: 0, maxTokens: 0, timeout: 0, budget: "$0.00", tools: ["human_review_gate"], role: "Human-in-the-loop checkpoint for quality assurance" },
};

const MODEL_OPTIONS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-pro"];

const ConfigRow: React.FC<{ icon: React.ReactNode; label: string; value: string | number; mono?: boolean }> = ({ icon, label, value, mono = false }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
    <div className="flex items-center gap-2 text-gray-400">
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </div>
    <span className={`text-[11px] text-gray-200 ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
  </div>
);

/** Fire-and-forget POST to persist agent config changes. Never blocks the UI. */
async function saveAgentConfig(agentType: string, model: string, temperature: number) {
  try {
    await fetch("/api/v1/agent/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_type: agentType, model, temperature }),
    });
  } catch (err) {
    console.error("[AgentConfigPanel] failed to save config:", err);
  }
}

export const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({ isOpen, onClose, nodeId, nodeData }) => {
  const agentType = (nodeData?.agentType as string) ?? "planner";
  const label = (nodeData?.label as string) ?? "Agent";
  const config = AGENT_CONFIGS[agentType] ?? AGENT_CONFIGS.planner;
  const isEditable = agentType !== "approval";

  const [selectedModel, setSelectedModel] = useState(config.model);
  const [selectedTemperature, setSelectedTemperature] = useState(config.temperature);
  const [showSaved, setShowSaved] = useState(false);

  // Reset local state when the selected agent changes
  useEffect(() => {
    setSelectedModel(config.model);
    setSelectedTemperature(config.temperature);
    setShowSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentType]);

  useEffect(() => {
    if (!showSaved) return;
    const timer = setTimeout(() => setShowSaved(false), 1500);
    return () => clearTimeout(timer);
  }, [showSaved]);

  const persistConfig = (model: string, temperature: number) => {
    saveAgentConfig(agentType, model, temperature);
    setShowSaved(true);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedModel(value);
    persistConfig(value, selectedTemperature);
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSelectedTemperature(value);
    persistConfig(selectedModel, value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[380px] bg-[#0d0e12]/95 backdrop-blur-xl border-l border-white/[0.08] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-100">{label}</h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">Node #{nodeId} · {agentType}</p>
              </div>
              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {showSaved && (
                    <motion.span
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-center gap-1 text-[10px] font-medium text-emerald-400"
                    >
                      <Check className="w-3 h-3" />
                      Saved
                    </motion.span>
                  )}
                </AnimatePresence>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/[0.06]">
              {/* Role */}
              <div>
                <h4 className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-2">Agent Role</h4>
                <p className="text-xs text-gray-300 leading-relaxed bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                  {config.role}
                </p>
              </div>

              {/* Model Configuration */}
              <div>
                <h4 className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-2">Model Configuration</h4>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-3.5">
                  {isEditable ? (
                    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05]">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[11px] font-medium">Primary Model</span>
                      </div>
                      <select
                        value={selectedModel}
                        onChange={handleModelChange}
                        className="bg-[#08090a] border border-white/[0.08] text-[11px] font-mono text-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                      >
                        {MODEL_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="bg-[#08090a]">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <ConfigRow
                      icon={<Cpu className="w-3.5 h-3.5 text-indigo-400" />}
                      label="Primary Model"
                      value={config.model}
                      mono
                    />
                  )}
                  <ConfigRow
                    icon={<Cpu className="w-3.5 h-3.5 text-cyan-400" />}
                    label="Fallback Model"
                    value={config.fallback}
                    mono
                  />
                  {isEditable ? (
                    <div className="py-2.5 border-b border-white/[0.05]">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[11px] font-medium">Temperature</span>
                        </div>
                        <span className="text-[11px] font-mono text-gray-200">{selectedTemperature.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={selectedTemperature}
                        onChange={handleTemperatureChange}
                        className="w-full h-1.5 accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <ConfigRow
                      icon={<Thermometer className="w-3.5 h-3.5 text-amber-400" />}
                      label="Temperature"
                      value={config.temperature}
                      mono
                    />
                  )}
                  <ConfigRow
                    icon={<Hash className="w-3.5 h-3.5 text-emerald-400" />}
                    label="Max Tokens"
                    value={config.maxTokens.toLocaleString()}
                    mono
                  />
                </div>
              </div>

              {/* Budget & Limits */}
              <div>
                <h4 className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-2">Budget &amp; Limits</h4>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-3.5">
                  <ConfigRow
                    icon={<Coins className="w-3.5 h-3.5 text-amber-400" />}
                    label="Cost Budget"
                    value={config.budget}
                    mono
                  />
                  <ConfigRow
                    icon={<Clock className="w-3.5 h-3.5 text-rose-400" />}
                    label="Timeout"
                    value={`${config.timeout}s`}
                    mono
                  />
                </div>
              </div>

              {/* Tools */}
              <div>
                <h4 className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-2">Available Tools</h4>
                <div className="flex flex-wrap gap-1.5">
                  {config.tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-[10px] font-mono text-indigo-300"
                    >
                      <Wrench className="w-2.5 h-2.5" />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Schema hint */}
              <div className="text-[10px] text-gray-600 bg-white/[0.01] border border-white/[0.04] rounded-lg p-2.5">
                Agent templates define role, input/output schema, tools, budget, and timeout per AE-03 spec (req #57).
                Model can be changed per agent without rewriting the workflow (req #56, demo #66).
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
