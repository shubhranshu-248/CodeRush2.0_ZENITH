import { FlowNode, FlowEdge, WorkflowGraph } from "@/types/workflow";

export function convertToReactFlowFormat(graph: WorkflowGraph): { nodes: FlowNode[]; edges: FlowEdge[] } {
  return {
    nodes: graph.nodes || [],
    edges: graph.edges || [],
  };
}

export function convertFromReactFlowFormat(nodes: FlowNode[], edges: FlowEdge[]): WorkflowGraph {
  return {
    nodes,
    edges,
  };
}
