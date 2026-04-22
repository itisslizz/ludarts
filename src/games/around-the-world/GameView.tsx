"use client";

import { useATWGameLogic } from "./useGameLogic";
import { Dartboard } from "@/components/Dartboard";
import { ThrowHistory } from "@/components/ThrowHistory";
import { ScorePicker } from "@/components/ScorePicker";
import { SEQUENCE } from "@/lib/constants";
import type { Segment } from "@/lib/types";

interface ATWGameViewProps {
  onThrowDetected: (handler: (segment: Segment, coords?: { x: number; y: number }) => void) => void;
  onQuit: () => void;
  onPlayAgain: () => void;
}

export function ATWGameView({
  onThrowDetected,
  onQuit,
  onPlayAgain,
}: ATWGameViewProps) {
  const { state, currentTarget, registerThrow, undo, reset } =
    useATWGameLogic();

  onThrowDetected(registerThrow);

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
      <div className="flex w-full max-w-6xl items-center justify-between">
        <button
          onClick={onQuit}
          className="rounded-xl border-2 border-zinc-300 px-6 py-3 text-lg font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Quit
        </button>
        <p className="text-xl text-zinc-500 dark:text-zinc-400">
          {progress} / {SEQUENCE.length}
        </p>
      </div>

      <h2 className="text-5xl font-bold">
        Hit <span className="text-yellow-400">{targetLabel}</span>
      </h2>

      <Dartboard currentTarget={currentTarget} />

      {/* Undo button */}
      <button
        onClick={undo}
        disabled={state.throwCount === 0}
        className="rounded-xl border-2 border-zinc-300 px-8 py-4 text-lg font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Undo Last Throw
      </button>

      {/* Manual score entry */}
      <ScorePicker onSelect={registerThrow} />

      <ThrowHistory history={state.history} throwCount={state.throwCount} />
    </div>
  );
}
