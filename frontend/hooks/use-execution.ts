"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExecutionState, StepLog } from "@/types/agent";
import { SSEClient } from "@/lib/sse";
import { runWorkflow, submitApproval, exportResult, type RunResponse } from "@/lib/api";

/**
 * Backend SSE event types (match EventType enum in backend/events/events.py)
 */
type BackendEventType =
  | "EXECUTION_STARTED"
  | "EXECUTION_COMPLETED"
  | "STEP_STARTED"
  | "STEP_COMPLETED"
  | "STEP_FAILED"
  | "APPROVAL_REQUIRED"
  | "APPROVAL_SUBMITTED"
  | "WORKFLOW_CREATED";

/**
 * DomainEvent payload shape from backend SSE
 */
interface DomainEvent {
  event_type: string;
  execution_id: string;
  data: Record<string, unknown>;
  timestamp: string;
  error?: string | null;
}

export function useExecution() {
  const sse = useRef(new SSEClient());

  const [runId, setRunId] = useState<string | null>(null);
  const [execution, setExecution] = useState<ExecutionState | null>(null);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [failedNode, setFailedNode] = useState<string | null>(null);
  const [approvalRequired, setApprovalRequired] = useState(false);

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  // Elapsed timer
  useEffect(() => {
    if (!startedAt || !isStreaming) return;
    const timer = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(timer);
  }, [startedAt, isStreaming]);

  const appendLog = useCallback((log: StepLog) => {
    setLogs((prev) => [...prev, log]);
  }, []);

  /**
   * Connect to SSE stream for a given execution ID.
   * Maps backend DomainEvent payloads to frontend state.
   */
  const connectSSE = useCallback(
    (executionId: string) => {
      setLogs([]);
      setCompletedNodes([]);
      setFailedNode(null);
      setCurrentNode(null);
      setApprovalRequired(false);
      setError(null);
      setElapsed(0);
      setStartedAt(Date.now());
      setIsStreaming(true);
      setTotalTokens(0);
      setTotalCost(0);

      sse.current.connect(executionId, (type, raw: unknown) => {
        const payload = raw as DomainEvent;
        const data = payload.data ?? {};

        switch (type as BackendEventType) {
          case "EXECUTION_STARTED":
            setExecution({
              id: payload.execution_id,
              workflowId: (data.workflow_id as string) ?? "",
              status: "RUNNING",
              logs: [],
              createdAt: payload.timestamp,
            });
            break;

          case "STEP_STARTED": {
            const nodeId = (data.node_id as string) ?? (data.step_id as string) ?? "";
            const agentType = (data.agent_type as string) ?? "planner";
            setCurrentNode(nodeId);

            appendLog({
              id: crypto.randomUUID(),
              executionId,
              nodeId,
              agentType: agentType as StepLog["agentType"],
              status: "running",
              inputs: (data.inputs as Record<string, unknown>) ?? {},
              outputs: {},
              stepNumber: (data.step_number as number) ?? 0,
              timestamp: payload.timestamp,
            });
            break;
          }

          case "STEP_COMPLETED": {
            const nodeId = (data.node_id as string) ?? (data.step_id as string) ?? "";
            const agentType = (data.agent_type as string) ?? "planner";
            setCurrentNode(null);
            setCompletedNodes((prev) =>
              prev.includes(nodeId) ? prev : [...prev, nodeId]
            );

            const tokensUsed = (data.tokens_used as number) ?? 0;
            const stepCost = (data.cost as number) ?? 0;
            setTotalTokens((prev) => prev + tokensUsed);
            setTotalCost((prev) => prev + stepCost);

            appendLog({
              id: crypto.randomUUID(),
              executionId,
              nodeId,
              agentType: agentType as StepLog["agentType"],
              status: "completed",
              inputs: (data.inputs as Record<string, unknown>) ?? {},
              outputs: (data.outputs as Record<string, unknown>) ?? {},
              stepNumber: (data.step_number as number) ?? 0,
              timestamp: payload.timestamp,
            });
            break;
          }

          case "STEP_FAILED": {
            const nodeId = (data.node_id as string) ?? (data.step_id as string) ?? "";
            const agentType = (data.agent_type as string) ?? "planner";
            setFailedNode(nodeId);

            appendLog({
              id: crypto.randomUUID(),
              executionId,
              nodeId,
              agentType: agentType as StepLog["agentType"],
              status: "failed",
              inputs: (data.inputs as Record<string, unknown>) ?? {},
              outputs: (data.outputs as Record<string, unknown>) ?? {},
              stepNumber: (data.step_number as number) ?? 0,
              timestamp: payload.timestamp,
            });
            break;
          }

          case "APPROVAL_REQUIRED":
            setApprovalRequired(true);
            setCurrentNode(null);
            setExecution((prev) =>
              prev ? { ...prev, status: "WAITING_APPROVAL" } : prev
            );
            break;

          case "APPROVAL_SUBMITTED":
            setApprovalRequired(false);
            setExecution((prev) =>
              prev
                ? {
                    ...prev,
                    status: (data.approved as boolean) ? "APPROVED" : "REJECTED",
                  }
                : prev
            );
            break;

          case "EXECUTION_COMPLETED":
            setExecution((prev) =>
              prev
                ? {
                    ...prev,
                    status: payload.error ? "FAILED" : "COMPLETED",
                    error: payload.error ?? undefined,
                    completedAt: payload.timestamp,
                  }
                : prev
            );
            setIsStreaming(false);
            setCurrentNode(null);
            sse.current.close();
            break;
        }
      });
    },
    [appendLog]
  );

  /**
   * Start a new execution from a goal string.
   * Calls POST /api/v1/run, then connects SSE.
   */
  const startRun = useCallback(
    async (goal: string, options?: Record<string, unknown>) => {
      setIsStarting(true);
      setError(null);

      try {
        const res = await runWorkflow(goal, options);

        if (res.status !== 200 || !res.data) {
          throw new Error(
            (res.data as unknown as { detail?: string })?.detail ??
              `Backend returned ${res.status}`
          );
        }

        const { id } = res.data;
        setRunId(id);
        connectSSE(id);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to start execution";
        setError(message);
        console.error("[useExecution] startRun failed:", err);
      } finally {
        setIsStarting(false);
      }
    },
    [connectSSE]
  );

  /**
   * Submit approval decision for current run.
   */
  const approve = useCallback(
    async (approved: boolean, feedback?: string) => {
      if (!runId) return;
      try {
        await submitApproval(runId, approved, feedback);
        setApprovalRequired(false);
      } catch (err) {
        console.error("[useExecution] approval failed:", err);
      }
    },
    [runId]
  );

  /**
   * Export result for current run.
   */
  const doExport = useCallback(
    async (format: "MARKDOWN" | "PDF" = "MARKDOWN") => {
      if (!runId) return;
      try {
        const res = await exportResult(runId, format);
        return res.data;
      } catch (err) {
        console.error("[useExecution] export failed:", err);
      }
    },
    [runId]
  );

  const stopExecution = useCallback(() => {
    sse.current.close();
    setIsStreaming(false);
    setCurrentNode(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => stopExecution, [stopExecution]);

  const progress = useMemo(() => {
    // Backend pipeline has ~7 steps; use completed unique nodes for progress
    const EXPECTED_STEPS = 7;
    const completedCount = completedNodes.length;
    if (completedCount === 0) return 0;
    return Math.min(100, Math.round((completedCount / EXPECTED_STEPS) * 100));
  }, [completedNodes]);

  return {
    // State
    runId,
    execution,
    logs,
    currentNode,
    completedNodes,
    failedNode,
    approvalRequired,
    progress,
    elapsed,
    isStreaming,
    isStarting,
    error,
    totalTokens,
    totalCost,

    // Actions
    startRun,
    connectSSE,
    stopExecution,
    approve,
    export: doExport,

    // Setters (for external use)
    setExecution,
  };
}
