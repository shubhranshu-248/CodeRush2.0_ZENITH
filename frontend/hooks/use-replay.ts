"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getReplayTimeline } from "@/lib/api";
import type { ExecutionEvent } from "@/components/agent/timeline-item";

/* ── Mock timeline: planner → researcher → approval → writer → verifier → exporter ── */
const MOCK_TIMELINE: ExecutionEvent[] = [
  {
    id: "evt-1",
    timestamp: "2026-08-07T10:00:00.000Z",
    nodeName: "Planner",
    status: "completed",
    duration: 1200,
  },
  {
    id: "evt-2",
    timestamp: "2026-08-07T10:00:02.100Z",
    nodeName: "Researcher",
    status: "completed",
    duration: 3400,
  },
  {
    id: "evt-3",
    timestamp: "2026-08-07T10:00:06.500Z",
    nodeName: "Approval Gate",
    status: "approval",
    duration: 800,
  },
  {
    id: "evt-4",
    timestamp: "2026-08-07T10:00:08.300Z",
    nodeName: "Writer",
    status: "completed",
    duration: 5200,
  },
  {
    id: "evt-5",
    timestamp: "2026-08-07T10:00:14.900Z",
    nodeName: "Verifier",
    status: "completed",
    duration: 2100,
  },
  {
    id: "evt-6",
    timestamp: "2026-08-07T10:00:17.600Z",
    nodeName: "Exporter",
    status: "running",
    duration: 900,
  },
];

const DEFAULT_SPEED_MS = 1500;

export interface UseReplayResult {
  currentStepIndex: number;
  setCurrentStepIndex: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  totalSteps: number;
  events: ExecutionEvent[];
  speed: number;
  loading: boolean;
  error: string | null;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBack: () => void;
  reset: () => void;
  setSpeed: (ms: number) => void;
}

export function useReplay(executionId: string | null): UseReplayResult {
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeedState] = useState<number>(DEFAULT_SPEED_MS);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Fetch timeline data (falls back to mock on error / empty) ── */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setCurrentStepIndex(0);
      setIsPlaying(false);

      if (!executionId) {
        if (!cancelled) {
          setEvents(MOCK_TIMELINE);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await getReplayTimeline(executionId);
        const data = res.data;
        if (cancelled) return;

        if (Array.isArray(data) && data.length > 0) {
          setEvents(data as ExecutionEvent[]);
        } else {
          setEvents(MOCK_TIMELINE);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load replay timeline");
          setEvents(MOCK_TIMELINE);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [executionId]);

  const totalSteps = events.length;

  const stepForward = useCallback(() => {
    setCurrentStepIndex((idx) => {
      if (totalSteps === 0) return idx;
      if (idx >= totalSteps - 1) {
        setIsPlaying(false);
        return idx;
      }
      return idx + 1;
    });
  }, [totalSteps]);

  const stepBack = useCallback(() => {
    setCurrentStepIndex((idx) => Math.max(0, idx - 1));
  }, []);

  const play = useCallback(() => {
    if (totalSteps === 0) return;
    setCurrentStepIndex((idx) => (idx >= totalSteps - 1 ? 0 : idx));
    setIsPlaying(true);
  }, [totalSteps]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  const setSpeed = useCallback((ms: number) => {
    setSpeedState(ms);
  }, []);

  /* ── Auto-advance while playing ── */
  useEffect(() => {
    if (!isPlaying || totalSteps === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentStepIndex((idx) => {
        if (idx >= totalSteps - 1) {
          setIsPlaying(false);
          return idx;
        }
        return idx + 1;
      });
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, speed, totalSteps]);

  return {
    currentStepIndex,
    setCurrentStepIndex,
    isPlaying,
    totalSteps,
    events,
    speed,
    loading,
    error,
    play,
    pause,
    stepForward,
    stepBack,
    reset,
    setSpeed,
  };
}
