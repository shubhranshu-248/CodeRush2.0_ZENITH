"use client";

import { useExecution } from "@/hooks/use-execution";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ReactFlow, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentNode } from "./nodes/agent-node";
import { ExecutionEdge } from "./edges/execution-edge";
import { FlowControls } from "./controls/flow-controls";
import { applyEdgeStatuses } from "@/lib/edge-utils";
import { EdgeGlowDefs } from "./edges/edge-glow-defs";
import { useDemoExecution } from "@/hooks/use-demo-execution";

/**
 * Maps backend LangGraph node names to canvas node IDs.
 */
const BACKEND_NODE_TO_CANVAS_IDS: Record<string, string[]> = {
  planner: ["1"],
  parallel_research: ["2", "3"],
  join: [],
  writer: ["4"],
  verifier: ["5"],
  approval: ["5"],
  final_output: [],
};

function getCanvasIdsForBackendNode(backendNodeName: string): string[] {
  return BACKEND_NODE_TO_CANVAS_IDS[backendNodeName] ?? [];
}

/* ── Demo data (only for demo mode) ── */
const createDemoNodes = (): Node[] => [
  { id: "1", type: "agentNode", position: { x: 250, y: 50 }, data: { label: "Planner Agent", agentType: "planner", status: "idle" } },
  { id: "2", type: "agentNode", position: { x: 100, y: 180 }, data: { label: "Researcher A", agentType: "researcher", status: "idle" } },
  { id: "3", type: "agentNode", position: { x: 400, y: 180 }, data: { label: "Researcher B", agentType: "researcher", status: "idle" } },
  { id: "4", type: "agentNode", position: { x: 250, y: 310 }, data: { label: "Writer Agent", agentType: "writer", status: "idle" } },
  { id: "5", type: "agentNode", position: { x: 250, y: 440 }, data: { label: "Verifier Agent", agentType: "verifier", status: "idle" } },
];

const demoEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e1-3", source: "1", target: "3" },
  { id: "e2-4", source: "2", target: "4" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e4-5", source: "4", target: "5" },
];

/* ── Canvas Props ── */
export interface CanvasProps {
  /** Externally-managed visible nodes (from graph generation hook) */
  visibleNodes?: Node[];
  /** Externally-managed visible edges */
  visibleEdges?: Edge[];
  /** All nodes ref for status updates */
  allNodes?: Node[];
  /** Node setter for live execution status sync */
  setNodes?: React.Dispatch<React.SetStateAction<Node[]>>;
  execution: ReturnType<typeof useExecution>;
  mode?: "demo" | "live";
  /** Callback when a node is clicked (for config panel) */
  onNodeClick?: (nodeId: string, nodeData: Record<string, unknown>) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  visibleNodes,
  visibleEdges,
  allNodes,
  setNodes: externalSetNodes,
  execution,
  mode = "live",
  onNodeClick,
}) => {
  const nodeTypes = useMemo(() => ({ agentNode: AgentNode }), []);
  const edgeTypes = useMemo(() => ({ executionEdge: ExecutionEdge }), []);

  // Demo mode: internal node state
  const [demoNodes, setDemoNodes] = useState<Node[]>(createDemoNodes);
  const demo = useDemoExecution(setDemoNodes);

  // Determine which nodes/edges to render
  const isLive = mode === "live";
  const displayNodes = isLive ? (visibleNodes ?? []) : demoNodes;
  const rawEdges = isLive ? (visibleEdges ?? []) : demoEdges;

  /**
   * Live mode: sync node statuses from useExecution SSE events.
   */
  useEffect(() => {
    if (!isLive || !externalSetNodes) return;
    if (!execution.isStreaming && !execution.execution) return;

    const completedCanvasIds = new Set<string>();
    const failedCanvasIds = new Set<string>();
    const runningCanvasIds = new Set<string>();

    for (const backendNode of execution.completedNodes) {
      for (const canvasId of getCanvasIdsForBackendNode(backendNode)) {
        completedCanvasIds.add(canvasId);
      }
    }

    if (execution.failedNode) {
      for (const canvasId of getCanvasIdsForBackendNode(execution.failedNode)) {
        failedCanvasIds.add(canvasId);
      }
    }

    if (execution.currentNode) {
      for (const canvasId of getCanvasIdsForBackendNode(execution.currentNode)) {
        runningCanvasIds.add(canvasId);
      }
    }

    externalSetNodes((prev) =>
      prev.map((n) => {
        let status: string = "idle";

        if (completedCanvasIds.has(n.id)) {
          status = "completed";
        } else if (failedCanvasIds.has(n.id)) {
          status = "failed";
        } else if (runningCanvasIds.has(n.id)) {
          status = "running";
        }

        if (execution.approvalRequired && n.id === "5") {
          status = "waiting_approval";
        }

        return n.data.status !== status
          ? { ...n, data: { ...n.data, status } }
          : n;
      })
    );
  }, [
    isLive,
    externalSetNodes,
    execution.currentNode,
    execution.completedNodes,
    execution.failedNode,
    execution.isStreaming,
    execution.approvalRequired,
    execution.execution,
  ]);

  // Derive edge statuses from node state
  const edges = useMemo(() => applyEdgeStatuses(rawEdges, displayNodes), [rawEdges, displayNodes]);

  const defaultEdgeOptions = useMemo(
    () => ({ type: "executionEdge" as const }),
    [],
  );

  const handleRunDemo = useCallback(() => {
    if (mode === "demo") demo.runDemo();
  }, [mode, demo]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id, node.data as Record<string, unknown>);
    },
    [onNodeClick],
  );

  return (
    <div className="flex-1 w-full h-full relative bg-[#0b0f19]">
      {/* Empty state when no nodes */}
      {displayNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center space-y-3"
          >
            {/* Animated icon container */}
            <motion.div
              className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] flex items-center justify-center relative"
              animate={{
                boxShadow: [
                  "0 0 0 rgba(99,102,241,0)",
                  "0 0 30px rgba(99,102,241,0.08)",
                  "0 0 0 rgba(99,102,241,0)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.svg
                className="w-9 h-9 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.2}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </motion.svg>
              {/* Subtle orbiting dot */}
              <motion.div
                className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400/40"
                animate={{
                  x: [0, 12, 0, -12, 0],
                  y: [-12, 0, 12, 0, -12],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>

            <div>
              <p className="text-sm text-gray-400 font-medium">Enter a goal to generate a workflow graph</p>
              <p className="text-[11px] text-gray-600 mt-1">The AI compiler will propose an optimized agent pipeline</p>
            </div>

            {/* Subtle ghost nodes preview */}
            <div className="flex items-center justify-center gap-3 mt-2 opacity-30">
              {["indigo", "cyan", "emerald", "amber"].map((c, i) => (
                <motion.div
                  key={c}
                  className="w-8 h-5 rounded-lg border border-white/[0.06] bg-white/[0.02]"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        onNodeClick={handleNodeClick}
      >
        <FlowControls
          onRunDemo={mode === "demo" ? handleRunDemo : undefined}
          onStopDemo={mode === "demo" ? demo.stopDemo : undefined}
          isRunning={mode === "demo" ? demo.isRunning : execution.isStreaming}
          onReset={mode === "demo" ? demo.resetAll : undefined}
          mode={mode}
        />
        <EdgeGlowDefs />
      </ReactFlow>
    </div>
  );
};
