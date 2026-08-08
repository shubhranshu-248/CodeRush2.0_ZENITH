import { useState } from "react";
import { FlowNode, FlowEdge, Workflow } from "@/types/workflow";

export function useWorkflow() {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);

  return {
    workflow,
    setWorkflow,
    nodes,
    setNodes,
    edges,
    setEdges,
  };
}
