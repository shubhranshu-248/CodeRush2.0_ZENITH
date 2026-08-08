import { AgentType } from "./workflow";

export interface AgentMetadata {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  iconName: string;
}

export interface StepLog {
  id: string;
  executionId: string;
  nodeId: string;
  agentType: AgentType;
  status: "running" | "completed" | "failed";
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  stepNumber: number;
  timestamp: string;
}

export interface ExecutionState {
  id: string;
  workflowId: string;
  status: "PENDING" | "RUNNING" | "WAITING_APPROVAL" | "APPROVED" | "REJECTED" | "COMPLETED" | "FAILED";
  error?: string;
  logs: StepLog[];
  createdAt: string;
  completedAt?: string;
}
