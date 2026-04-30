"use client";

import { useATWGameLogic } from "./useGameLogic";
import { Dartboard } from "@/components/Dartboard";
import { ThrowHistory } from "@/components/ThrowHistory";
import { ScorePicker } from "@/components/ScorePicker";
import { SEQUENCE } from "@/lib/constants";
import type { Segment } from "@/lib/types";

interface ATWGameViewProps {
  onThrowDetected: (handler: (segment: Segment, coords?: { x: number; y: number }) => void) => void;
  onUndo: (handler: () => void, canUndo: boolean) => void;
  onQuit: () => void;
  onPlayAgain: () => void;
}

export function ATWGameView({
  onThrowDetected,
  onUndo,
  onQuit,
  onPlayAgain,
}: ATWGameViewProps) {
  const { state, currentTarget, registerThrow, undo, reset } =
    useATWGameLogic();

  const canUndo = state.throwCount > 0;

  onThrowDetected(registerThrow);
  onUndo(undo, canUndo);

  if (state.phase === "complete") {
    const hits = state.history.filter((r) => r.hit).length;
    const accuracy = Math.round((hits / state.throwCount) * 100);

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-12">
        <div className="text-center">
          <h1 className="text-6xl font-bold">Game Complete!</h1>
          <p className="mt-4 text-2xl text-zinc-500 dark:text-zinc-400">
            {state.throwCount} throws &middot; {accuracy}% accuracy
          </p>
        </div>
        <ThrowHistory history={state.history} throwCount={state.throwCount} />
        {/* Floating action buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          <button
            onClick={onQuit}
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-zinc-300 bg-white shadow-lg transition-all hover:scale-110 hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
            title="Home"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <button
            onClick={() => {
              reset();
              onPlayAgain();
            }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 shadow-lg transition-all hover:scale-110 hover:bg-green-500 hover:shadow-xl active:bg-green-700"
            title="Play Again"
          >
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  const targetLabel = currentTarget === 25 ? "Bullseye" : currentTarget;
  const progress = state.currentTargetIndex;

  return (
    <div className="flex flex-1 flex-col items-center gap-8 py-8">
      <p className="text-xl text-zinc-500 dark:text-zinc-400">
        {progress} / {SEQUENCE.length}
      </p>

      <h2 className="text-5xl font-bold">
        Hit <span className="text-yellow-400">{targetLabel}</span>
      </h2>

      <Dartboard currentTarget={currentTarget} />

      {/* Manual score entry */}
      <ScorePicker onSelect={registerThrow} />

      <ThrowHistory history={state.history} throwCount={state.throwCount} />
    </div>
  );
}
