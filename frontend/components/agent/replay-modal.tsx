"use client";

import React, { useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { ReplayControls } from "./replay-controls";
import { ExecutionTimeline } from "./timeline";
import type { ExecutionEvent } from "./timeline-item";
import { useReplay } from "@/hooks/use-replay";

interface ReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  executionId: string | null;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({ isOpen, onClose, executionId }) => {
  const {
    currentStepIndex,
    isPlaying,
    totalSteps,
    events,
    speed,
    play,
    pause,
    stepForward,
    stepBack,
    reset,
    setSpeed,
  } = useReplay(executionId);

  /* ── Highlight steps up to currentStepIndex, dim/queue future steps ── */
  const displayEvents: ExecutionEvent[] = useMemo(
    () =>
      events.map((event, i) =>
        i <= currentStepIndex ? event : { ...event, status: "queued" as const }
      ),
    [events, currentStepIndex]
  );

  const currentEvent = events[currentStepIndex];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Replay Execution">
      <div className="flex flex-col gap-4">
        {currentEvent && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Current step</span>
            <span className="text-[11px] font-semibold text-indigo-300">
              {currentEvent.nodeName}
            </span>
          </div>
        )}

        <ReplayControls
          isPlaying={isPlaying}
          onPlay={play}
          onPause={pause}
          onStepForward={stepForward}
          onStepBack={stepBack}
          onReset={reset}
          currentStep={currentStepIndex}
          totalSteps={totalSteps}
          speed={speed}
          onSpeedChange={setSpeed}
        />

        <ExecutionTimeline events={displayEvents} maxHeight="360px" />
      </div>
    </Modal>
  );
};
