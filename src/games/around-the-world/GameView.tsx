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
        <div className="flex gap-6">
          <button
            onClick={onQuit}
            className="rounded-2xl border-2 border-zinc-300 px-10 py-5 text-xl font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Home
          </button>
          <button
            onClick={() => {
              reset();
              onPlayAgain();
            }}
            className="rounded-2xl bg-green-600 px-12 py-5 text-2xl font-semibold text-white transition-colors hover:bg-green-500 active:bg-green-700"
          >
            Play Again
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
