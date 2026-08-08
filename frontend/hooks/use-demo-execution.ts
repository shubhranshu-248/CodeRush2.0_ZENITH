import { useCallback, useRef, useState } from "react";
import type { Node } from "@xyflow/react";

type NodeStatus = "idle" | "queued" | "running" | "completed" | "failed" | "waiting_approval";

/**
 * A demo execution step — run one or more nodes in parallel.
 * Each entry: [nodeId, durationMs]
 */
export interface DemoStep {
  /** Nodes to execute in this step (parallel if multiple) */
  nodes: Array<{ id: string; duration: number }>;
}

/** Default Nexora demo pipeline */
export const DEFAULT_DEMO_STEPS: DemoStep[] = [
  { nodes: [{ id: "1", duration: 800 }] },                          // Planner
  { nodes: [{ id: "2", duration: 1400 }, { id: "3", duration: 1400 }] }, // Research A + B parallel
  { nodes: [{ id: "4", duration: 1200 }] },                         // Writer
  { nodes: [{ id: "5", duration: 900 }] },                          // Verifier
];

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Reusable node-status updater + demo sequencer.
 *
 * `updateNodeStatus` is the single function that mutates node state —
 * the demo sequencer uses it now, and SSE will call the same function later.
 */
export function useDemoExecution(
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
) {
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /** Core primitive: update a single node's data.status (and optional fields). */
  const updateNodeStatus = useCallback(
    (nodeId: string, status: NodeStatus, extra?: Record<string, unknown>) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, status, ...extra } }
            : n,
        ),
      );
    },
    [setNodes],
  );

  /** Reset every node to idle. */
  const resetAll = useCallback(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...n.data, status: "idle", duration: undefined, error: undefined },
      })),
    );
  }, [setNodes]);

  /** Run the demo sequence. */
  const runDemo = useCallback(
    async (steps: DemoStep[] = DEFAULT_DEMO_STEPS) => {
      // Abort any existing run
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      resetAll();
      setIsRunning(true);

      // Brief pause so the reset renders before the first transition
      await delay(150);

      try {
        for (const step of steps) {
          if (controller.signal.aborted) return;

          // Mark all nodes in this step as running
          for (const { id } of step.nodes) {
            updateNodeStatus(id, "running");
          }

          // Wait for all durations in parallel
          await Promise.all(
            step.nodes.map(async ({ id, duration }) => {
              const start = Date.now();
              await delay(duration);
              if (controller.signal.aborted) return;
              updateNodeStatus(id, "completed", { duration: Date.now() - start });
            }),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsRunning(false);
        }
      }
    },
    [resetAll, updateNodeStatus],
  );

  /** Stop current demo and reset. */
  const stopDemo = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
    resetAll();
  }, [resetAll]);

  return {
    isRunning,
    runDemo,
    stopDemo,
    updateNodeStatus,
    resetAll,
  };
}
