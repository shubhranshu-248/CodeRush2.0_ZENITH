"use client";

import React, { memo } from "react";
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export type EdgeStatus = "idle" | "queued" | "running" | "completed" | "failed";

const edgeStyles: Record<EdgeStatus, { stroke: string; strokeWidth: number; opacity: number; filter?: string }> = {
  idle: { stroke: "rgba(255,255,255,0.1)", strokeWidth: 1.5, opacity: 1 },
  queued: { stroke: "rgba(161,161,170,0.2)", strokeWidth: 1, opacity: 0.5 },
  running: { stroke: "#818cf8", strokeWidth: 2.5, opacity: 1, filter: "url(#edge-glow-indigo)" },
  completed: { stroke: "#34d399", strokeWidth: 2, opacity: 1, filter: "url(#edge-glow-emerald)" },
  failed: { stroke: "#f87171", strokeWidth: 1.5, opacity: 0.9 },
};

export const ExecutionEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) => {
  const status = ((data?.status as string) || "idle") as EdgeStatus;
  const style = edgeStyles[status] || edgeStyles.idle;
  const isRunning = status === "running";
  const isCompleted = status === "completed";

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <defs>
        <linearGradient id={`edge-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60A5FA">
            <animate attributeName="offset" values="-1;1" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#818CF8">
            <animate attributeName="offset" values="0;2" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#34D399">
            <animate attributeName="offset" values="1;3" dur="2s" repeatCount="indefinite" />
          </stop>
        </linearGradient>

        <linearGradient id={`edge-completed-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient>
      </defs>

      {/* Glow layer for running edges */}
      {isRunning && (
        <path
          d={edgePath}
          fill="none"
          stroke="#818cf8"
          strokeWidth={8}
          strokeOpacity={0.1}
          className="react-flow__edge-path"
          filter="url(#edge-glow-indigo)"
        />
      )}

      {/* Glow layer for completed edges */}
      {isCompleted && (
        <path
          d={edgePath}
          fill="none"
          stroke="#34d399"
          strokeWidth={6}
          strokeOpacity={0.08}
          className="react-flow__edge-path"
          filter="url(#edge-glow-emerald)"
        />
      )}

      <BaseEdge
        strokeDasharray={isRunning ? "8 6" : undefined}
        strokeDashoffset={0}
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isRunning
            ? `url(#edge-gradient-${id})`
            : isCompleted
            ? `url(#edge-completed-${id})`
            : style.stroke,
          strokeWidth: isRunning ? 3 : style.strokeWidth,
          opacity: style.opacity,
          strokeLinecap: "round" as const,
          transition: "stroke 0.5s ease, stroke-width 0.3s ease, opacity 0.5s ease",
        }}
      />

      {/* Animated flowing dot for running edges */}
      {isRunning && (
        <>
          <circle r="3.5" fill="#818cf8" filter="url(#edge-glow-indigo)" opacity={0.8}>
            <animateMotion dur="1.4s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="1.5" fill="#e0e7ff">
            <animateMotion dur="1.4s" repeatCount="indefinite" path={edgePath} />
          </circle>
        </>
      )}

      {/* Completed: subtle success pulse at midpoint */}
      {isCompleted && (
        <circle r="2" fill="#34d399" opacity={0.5}>
          <animateMotion dur="0" fill="freeze" path={edgePath} keyPoints="0.5;0.5" keyTimes="0;1" />
          <animate attributeName="r" values="2;4;2" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.15;0.5" dur="3s" repeatCount="indefinite" />
        </circle>
      )}
    </>
  );
});

ExecutionEdge.displayName = "ExecutionEdge";
