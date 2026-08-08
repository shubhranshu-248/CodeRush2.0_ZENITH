import type { GoalRequest, ApiResponse } from "@/types/api";
import type { Workflow } from "@/types/workflow";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** POST /api/v1/workflow/generate — parse goal → workflow graph */
export async function generateWorkflow(payload: GoalRequest): Promise<ApiResponse<Workflow>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflow/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return { data, status: response.status };
}

/** POST /api/v1/run — start execution from goal */
export interface RunResponse {
  id: string;
  run_id: string;
  status: string;
  state_snapshot: Record<string, unknown> | null;
}

export async function runWorkflow(goal: string, options?: Record<string, unknown>): Promise<ApiResponse<RunResponse>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, options: options ?? {} }),
  });
  const data = await response.json();
  return { data, status: response.status };
}

/** GET /api/v1/runs/{id} — get run state */
export async function getRun(runId: string): Promise<ApiResponse<RunResponse>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/runs/${runId}`);
  const data = await response.json();
  return { data, status: response.status };
}

/** POST /api/v1/approve — submit approval decision */
export async function submitApproval(
  runId: string,
  approved: boolean,
  feedback?: string
): Promise<ApiResponse<RunResponse>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ run_id: runId, approved, feedback }),
  });
  const data = await response.json();
  return { data, status: response.status };
}

/** GET /api/v1/replay/{executionId}/timeline — replay timeline */
export async function getReplayTimeline(executionId: string): Promise<ApiResponse<unknown[]>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/replay/${executionId}/timeline`);
  const data = await response.json();
  return { data, status: response.status };
}

/** POST /api/v1/export — export result */
export async function exportResult(
  runId: string,
  format: "MARKDOWN" | "PDF" = "MARKDOWN"
): Promise<ApiResponse<unknown>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ run_id: runId, format }),
  });
  const data = await response.json();
  return { data, status: response.status };
}
