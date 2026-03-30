"use client";

import { useState } from "react";
import { getGame } from "@/lib/games";
import type { GameConfig } from "@/lib/types";

interface GameConfigScreenProps {
  gameId: string;
  onContinue: (config: GameConfig) => void;
  onBack: () => void;
}

function X01Config({
  onContinue,
  onBack,
}: {
  onContinue: (config: GameConfig) => void;
  onBack: () => void;
}) {
  const [baseScore, setBaseScore] = useState<301 | 501 | 701>(501);
  const [outMode, setOutMode] = useState<"double" | "straight">("double");

  return (
    <div className="flex flex-1 flex-col items-center gap-8 py-8">
      <h1 className="text-3xl font-bold">X01 Setup</h1>

      {/* Base score */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Starting Score
        </p>
        <div className="flex gap-2">
          {([301, 501, 701] as const).map((score) => (
            <button
              key={score}
              onClick={() => setBaseScore(score)}
              className={`rounded-lg px-6 py-3 text-lg font-semibold transition-colors ${
                baseScore === score
                  ? "bg-green-600 text-white"
                  : "bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {score}
            </button>
          ))}
        </div>
      </div>

      {/* Out mode */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Out Mode
        </p>
        <div className="flex gap-2">
          {(["double", "straight"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setOutMode(mode)}
              className={`rounded-lg px-6 py-3 text-sm font-semibold capitalize transition-colors ${
                outMode === mode
                  ? "bg-green-600 text-white"
                  : "bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {mode} Out
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Back
        </button>
        <button
          onClick={() => onContinue({ baseScore, outMode })}
          className="rounded-full bg-green-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-500"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function GameConfigScreen({
  gameId,
  onContinue,
  onBack,
}: GameConfigScreenProps) {
  const game = getGame(gameId);

  if (gameId === "x01") {
    return <X01Config onContinue={onContinue} onBack={onBack} />;
  }

  // Fallback for games without config — shouldn't reach here
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <p>No configuration needed for {game?.name ?? gameId}</p>
      <button
        onClick={() => onContinue({})}
        className="rounded-full bg-green-600 px-8 py-3 text-sm font-semibold text-white"
      >
        Continue
      </button>
    </div>
  );
}
