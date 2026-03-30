"use client";

import { useGameState } from "@/hooks/useGameState";
import { Dartboard } from "@/components/Dartboard";
import { ThrowHistory } from "@/components/ThrowHistory";
import { SEQUENCE } from "@/lib/constants";
import type { Segment } from "@/lib/types";

interface GameScreenProps {
  gameId: string;
  playerIds: string[];
  onThrowDetected: (handler: (segment: Segment) => void) => void;
  onQuit: () => void;
  onPlayAgain: () => void;
}

export function GameScreen({
  onThrowDetected,
  onQuit,
  onPlayAgain,
}: GameScreenProps) {
  const { state, currentTarget, registerThrow, reset } = useGameState();

  // Register throw handler with parent
  onThrowDetected(registerThrow);

  if (state.phase === "complete") {
    const hits = state.history.filter((r) => r.hit).length;
    const accuracy = Math.round((hits / state.throwCount) * 100);

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Game Complete!</h1>
          <p className="mt-2 text-lg text-zinc-500 dark:text-zinc-400">
            {state.throwCount} throws &middot; {accuracy}% accuracy
          </p>
        </div>
        <ThrowHistory history={state.history} throwCount={state.throwCount} />
        <div className="flex gap-4">
          <button
            onClick={onQuit}
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Home
          </button>
          <button
            onClick={() => {
              reset();
              onPlayAgain();
            }}
            className="rounded-full bg-green-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-500 active:bg-green-700"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Playing phase
  const targetLabel = currentTarget === 25 ? "Bullseye" : currentTarget;
  const progress = state.currentTargetIndex;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-6">
      <div className="flex w-full max-w-md items-center justify-between">
        <button
          onClick={onQuit}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Quit
        </button>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {progress} / {SEQUENCE.length}
        </p>
      </div>

      <h2 className="text-3xl font-bold">
        Hit <span className="text-yellow-400">{targetLabel}</span>
      </h2>

      <Dartboard currentTarget={currentTarget} />

      <ThrowHistory history={state.history} throwCount={state.throwCount} />
    </div>
  );
}
