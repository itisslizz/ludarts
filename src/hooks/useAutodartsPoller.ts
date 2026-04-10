"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { AutodartsState, Segment } from "@/lib/types";

interface UseAutodartsPollerOptions {
  processThrows: boolean;
  onThrowDetected: (segment: Segment, coords?: { x: number; y: number }) => void;
  onTakeout?: () => void;
  intervalMs?: number;
}

export function useAutodartsPoller({
  processThrows,
  onThrowDetected,
  onTakeout,
  intervalMs = 1000,
}: UseAutodartsPollerOptions) {
  const prevLengthRef = useRef(0);
  const prevStatusRef = useRef<string | null>(null);
  const onThrowRef = useRef(onThrowDetected);
  const onTakeoutRef = useRef(onTakeout);
  const processThrowsRef = useRef(processThrows);
  const [boardRunning, setBoardRunning] = useState<boolean | null>(null);

  useEffect(() => {
    onThrowRef.current = onThrowDetected;
  }, [onThrowDetected]);

  useEffect(() => {
    onTakeoutRef.current = onTakeout;
  }, [onTakeout]);

  useEffect(() => {
    processThrowsRef.current = processThrows;
    if (!processThrows) {
      prevLengthRef.current = 0;
    }
  }, [processThrows]);

  const resetTracking = useCallback(() => {
    prevLengthRef.current = 0;
    prevStatusRef.current = null;
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/autodarts/state");
        const data = await res.json();

        if (data.status === "offline") {
          setBoardRunning(null);
          return;
        }

        setBoardRunning(Boolean(data.running));

        if (!processThrowsRef.current) return;

        const throws: AutodartsState["throws"] = data.throws ?? [];
        const currentLength = throws.length;
        const prevLength = prevLengthRef.current;

        if (currentLength > prevLength) {
          const newThrows = throws.slice(prevLength);
          for (const dart of newThrows) {
            onThrowRef.current(dart.segment, dart.coords);
          }
        }

        prevLengthRef.current = currentLength;

        // Detect transition to Takeout status
        const status = data.status as string;
        if (status === "Takeout" && prevStatusRef.current !== "Takeout") {
          onTakeoutRef.current?.();
        }
        prevStatusRef.current = status;
      } catch {
        setBoardRunning(null);
      }
    };

    const id = setInterval(poll, intervalMs);
    poll();
    return () => clearInterval(id);
  }, [intervalMs]);

  return { resetTracking, boardRunning };
}
