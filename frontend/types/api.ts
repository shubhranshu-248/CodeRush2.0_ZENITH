import { WorkflowGraph, Workflow } from "./workflow";
import { ExecutionState } from "./agent";

export interface GoalRequest {
  goal: string;
  options?: Record<string, unknown>;
}

export interface ApprovalRequest {
  executionId: string;
  approved: boolean;
  feedback?: string;
}

export interface ExportFormatRequest {
  executionId: string;
  format: "MARKDOWN" | "PDF";
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
