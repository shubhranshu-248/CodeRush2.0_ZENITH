"use client";

import React, { memo } from "react";

/**
 * SVG filter definitions for edge glow effects.
 * Rendered once inside <ReactFlow> — the filter IDs are referenced by ExecutionEdge.
 */
export const EdgeGlowDefs = memo(() => (
  <svg style={{ position: "absolute", width: 0, height: 0 }}>
    <defs>
      {/* Indigo glow — running edges */}
      <filter id="edge-glow-indigo" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="0.5 0 0 0 0.31
                  0 0.5 0 0 0.35
                  0 0 1 0 0.96
                  0 0 0 0.6 0"
          result="glow"
        />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Emerald glow — completed edges */}
      <filter id="edge-glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="0 0 0 0 0.06
                  0 0.8 0 0 0.73
                  0 0 0.5 0 0.49
                  0 0 0 0.4 0"
          result="glow"
        />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Red glow — failed edges */}
      <filter id="edge-glow-red" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0.94
                  0 0.3 0 0 0.27
                  0 0 0.3 0 0.27
                  0 0 0 0.5 0"
          result="glow"
        />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
));

EdgeGlowDefs.displayName = "EdgeGlowDefs";
