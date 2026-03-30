"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { AutodartsState, Segment } from "@/lib/types";

interface UseAutodartsPollerOptions {
  processThrows: boolean;
  onThrowDetected: (segment: Segment) => void;
  intervalMs?: number;
}

export function useAutodartsPoller({
  processThrows,
  onThrowDetected,
  intervalMs = 1000,
}: UseAutodartsPollerOptions) {
  const prevLengthRef = useRef(0);
  const onThrowRef = useRef(onThrowDetected);
  const processThrowsRef = useRef(processThrows);
  const [boardRunning, setBoardRunning] = useState<boolean | null>(null);

  useEffect(() => {
    onThrowRef.current = onThrowDetected;
  }, [onThrowDetected]);

  useEffect(() => {
    processThrowsRef.current = processThrows;
    if (!processThrows) {
      prevLengthRef.current = 0;
    }
  }, [processThrows]);

  const resetTracking = useCallback(() => {
    prevLengthRef.current = 0;
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
            onThrowRef.current(dart.segment);
          }
        }

        prevLengthRef.current = currentLength;
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
