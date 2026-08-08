export type AgentType =
  | "planner"
  | "researcher"
  | "parallel_research"
  | "writer"
  | "verifier"
  | "join"
  | "approval"
  | "final_output";

export interface NodeConfig {
  temperature?: number;
  prompt?: string;
  maxTokens?: number;
  [key: string]: unknown;
}

export interface NodeData {
  label: string;
  agentType: AgentType;
  config?: NodeConfig;
  status?: "idle" | "queued" | "running" | "completed" | "failed" | "waiting_approval";
  duration?: number;
  error?: string;
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface WorkflowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface Workflow {
  id: string;
  goal: string;
  graphData: WorkflowGraph;
  status: "DRAFT" | "COMPILED" | "EXECUTING" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
}
