"use client";

import { useGameState } from "@/hooks/useGameState";
import { useAutodartsPoller } from "@/hooks/useAutodartsPoller";
import { StartScreen } from "@/components/StartScreen";
import { Dartboard } from "@/components/Dartboard";
import { ThrowHistory } from "@/components/ThrowHistory";
import { BoardControls } from "@/components/BoardControls";
import { SEQUENCE } from "@/lib/constants";

export function GameScreen() {
  const { state, currentTarget, startGame, registerThrow, reset } =
    useGameState();

  const { boardRunning } = useAutodartsPoller({
    processThrows: state.phase === "playing",
    onThrowDetected: registerThrow,
  });

  if (state.phase === "idle") {
    return (
      <StartScreen onStart={startGame} boardRunning={boardRunning} />
    );
  }

  if (state.phase === "complete") {
    const hits = state.history.filter((r) => r.hit).length;
    const accuracy = Math.round((hits / state.throwCount) * 100);

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <BoardControls boardRunning={boardRunning} />
        <div className="text-center">
          <h1 className="text-4xl font-bold">Game Complete!</h1>
          <p className="mt-2 text-lg text-zinc-500 dark:text-zinc-400">
            {state.throwCount} throws &middot; {accuracy}% accuracy
          </p>
        </div>
        <ThrowHistory history={state.history} throwCount={state.throwCount} />
        <button
          onClick={reset}
          className="rounded-full bg-green-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-500 active:bg-green-700"
        >
          Play Again
        </button>
      </div>
    );
  }

  // Playing phase
  const targetLabel = currentTarget === 25 ? "Bullseye" : currentTarget;
  const progress = state.currentTargetIndex;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-6">
      <div className="text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {progress} / {SEQUENCE.length}
        </p>
        <h2 className="text-3xl font-bold">
          Hit{" "}
          <span className="text-yellow-400">{targetLabel}</span>
        </h2>
      </div>

      <BoardControls boardRunning={boardRunning} />

      <Dartboard currentTarget={currentTarget} />

      <ThrowHistory history={state.history} throwCount={state.throwCount} />
    </div>
  );
}
