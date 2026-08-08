"use client";

import { useCallback, useRef, useState } from "react";
import { Node, Edge } from "@xyflow/react";

/**
 * Default pipeline graph — matches the LangGraph topology:
 * planner → parallel_research (2 researchers) → writer → verifier
 */
const PIPELINE_NODES: Node[] = [
  { id: "1", type: "agentNode", position: { x: 250, y: 50 }, data: { label: "Planner Agent", agentType: "planner", status: "idle" } },
  { id: "2", type: "agentNode", position: { x: 100, y: 180 }, data: { label: "Researcher A", agentType: "researcher", status: "idle" } },
  { id: "3", type: "agentNode", position: { x: 400, y: 180 }, data: { label: "Researcher B", agentType: "researcher", status: "idle" } },
  { id: "4", type: "agentNode", position: { x: 250, y: 310 }, data: { label: "Writer Agent", agentType: "writer", status: "idle" } },
  { id: "5", type: "agentNode", position: { x: 250, y: 440 }, data: { label: "Verifier Agent", agentType: "verifier", status: "idle" } },
];

const PIPELINE_EDGES: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e1-3", source: "1", target: "3" },
  { id: "e2-4", source: "2", target: "4" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e4-5", source: "4", target: "5" },
];

/** Node reveal order — groups appear together (parallel researchers) */
const REVEAL_SEQUENCE: string[][] = [
  ["1"],       // Planner
  ["2", "3"],  // Parallel researchers (same step)
  ["4"],       // Writer
  ["5"],       // Verifier
];

/** Edge reveal — each edge appears after its source node is visible */
const EDGE_REVEAL_AFTER_NODE: Record<string, string[]> = {
  "1": ["e1-2", "e1-3"],
  "2": ["e2-4"],
  "3": ["e3-4"],
  "4": ["e4-5"],
};

export interface GraphGenerationState {
  /** Whether the graph generation animation is in progress */
  isGenerating: boolean;
  /** Whether all nodes have been revealed and graph is ready for execution */
  graphReady: boolean;
  /** Currently visible nodes (animated in) */
  visibleNodes: Node[];
  /** Currently visible edges */
  visibleEdges: Edge[];
  /** All nodes (for execution phase — includes status updates) */
  allNodes: Node[];
  /** Start the staggered reveal animation */
  generateGraph: () => void;
  /** Reset to empty canvas */
  resetGraph: () => void;
  /** Set nodes (for execution status updates) */
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

const STAGGER_DELAY = 600; // ms between each reveal group

export function useGraphGeneration(): GraphGenerationState {
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(new Set());
  const [visibleEdgeIds, setVisibleEdgeIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [graphReady, setGraphReady] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const generateGraph = useCallback(() => {
    // Clear previous state
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setAllNodes(PIPELINE_NODES.map((n) => ({ ...n, data: { ...n.data, status: "idle" } })));
    setVisibleNodeIds(new Set());
    setVisibleEdgeIds(new Set());
    setIsGenerating(true);
    setGraphReady(false);

    // Staggered reveal
    REVEAL_SEQUENCE.forEach((group, groupIdx) => {
      const nodeTimer = setTimeout(() => {
        // Reveal nodes in this group
        setVisibleNodeIds((prev) => {
          const next = new Set(prev);
          group.forEach((id) => next.add(id));
          return next;
        });

        // Reveal edges whose source is in this group (slight delay after node)
        const edgeTimer = setTimeout(() => {
          setVisibleEdgeIds((prev) => {
            const next = new Set(prev);
            group.forEach((nodeId) => {
              const edges = EDGE_REVEAL_AFTER_NODE[nodeId];
              if (edges) edges.forEach((eid) => next.add(eid));
            });
            return next;
          });
        }, 200);
        timersRef.current.push(edgeTimer);

        // If last group, mark generation complete
        if (groupIdx === REVEAL_SEQUENCE.length - 1) {
          const doneTimer = setTimeout(() => {
            setIsGenerating(false);
            setGraphReady(true);
          }, 400);
          timersRef.current.push(doneTimer);
        }
      }, groupIdx * STAGGER_DELAY);
      timersRef.current.push(nodeTimer);
    });
  }, []);

  const resetGraph = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setAllNodes([]);
    setVisibleNodeIds(new Set());
    setVisibleEdgeIds(new Set());
    setIsGenerating(false);
    setGraphReady(false);
  }, []);

  // Filter to only visible nodes/edges
  const visibleNodes = allNodes.filter((n) => visibleNodeIds.has(n.id));
  const visibleEdges = PIPELINE_EDGES.filter((e) => visibleEdgeIds.has(e.id));

  return {
    isGenerating,
    graphReady,
    visibleNodes,
    visibleEdges,
    allNodes,
    generateGraph,
    resetGraph,
    setNodes: setAllNodes,
  };
}
