import type { Node, Edge } from "@xyflow/react";
import type { EdgeStatus } from "@/components/flow/edges/execution-edge";

type NodeStatus = "idle" | "queued" | "running" | "completed" | "failed" | "waiting_approval";

/**
 * Derives edge visual status from source node's execution status.
 * - Source running → edge running (animated flow)
 * - Source completed → edge completed (bright green)
 * - Source failed → edge failed (red)
 * - Source queued → edge queued (muted)
 * - Otherwise → idle
 */
export function deriveEdgeStatus(sourceStatus: NodeStatus | undefined): EdgeStatus {
  switch (sourceStatus) {
    case "running":
      return "running";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "queued":
      return "queued";
    default:
      return "idle";
  }
}

/**
 * Applies execution-aware styling to edges based on their source node's status.
 * Returns new edge array with `data.status` and `type` set for the custom edge renderer.
 * Only creates a new array/objects when statuses actually change.
 */
export function applyEdgeStatuses(
  edges: Edge[],
  nodes: Node[],
): Edge[] {
  const nodeStatusMap = new Map<string, NodeStatus>();
  for (const node of nodes) {
    nodeStatusMap.set(node.id, (node.data?.status as NodeStatus) || "idle");
  }

  return edges.map((edge) => {
    const sourceStatus = nodeStatusMap.get(edge.source);
    const edgeStatus = deriveEdgeStatus(sourceStatus);
    const currentStatus = (edge.data?.status as string) || "idle";

    // Skip creating new object if status hasn't changed
    if (currentStatus === edgeStatus && edge.type === "executionEdge") {
      return edge;
    }

    return {
      ...edge,
      type: "executionEdge",
      // Remove default animated prop — our custom edge handles its own animation
      animated: false,
      data: { ...edge.data, status: edgeStatus },
    };
  });
}
