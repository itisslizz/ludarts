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
  const [baseScore, setBaseScore] = useState<301 | 501 | 701>(301);
  const [outMode, setOutMode] = useState<"double" | "straight">("double");
  const [firstTo, setFirstTo] = useState<1 | 2 | 3>(1);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Bar with Actions */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b-2 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 purple:border-purple-900 purple:bg-purple-950">
        <button
          onClick={onBack}
          className="rounded-xl border-2 border-zinc-300 px-8 py-3 text-lg font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 purple:border-purple-700 purple:hover:bg-purple-900"
        >
          Back
        </button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold">X01 Setup</h1>
        </div>
        
        <button
          onClick={() => onContinue({ baseScore, outMode, firstTo })}
          className="rounded-xl bg-green-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-500"
        >
          Next
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8 overflow-y-auto">
        {/* Base score */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl font-medium text-zinc-500 dark:text-zinc-400">
            Starting Score
          </p>
          <div className="flex gap-4">
            {([301, 501, 701] as const).map((score) => (
              <button
                key={score}
                onClick={() => setBaseScore(score)}
                className={`rounded-2xl px-10 py-5 text-2xl font-semibold transition-colors ${
                  baseScore === score
                    ? "bg-green-600 text-white"
                    : "bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 purple:bg-purple-700 purple:text-purple-200 purple:hover:bg-purple-600"
                }`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>

        {/* Out mode */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl font-medium text-zinc-500 dark:text-zinc-400">
            Out Mode
          </p>
          <div className="flex gap-4">
            {(["double", "straight"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setOutMode(mode)}
                className={`rounded-2xl px-10 py-5 text-2xl font-semibold capitalize transition-colors ${
                  outMode === mode
                    ? "bg-green-600 text-white"
                    : "bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 purple:bg-purple-700 purple:text-purple-200 purple:hover:bg-purple-600"
                }`}
              >
                {mode} Out
              </button>
            ))}
          </div>
        </div>

        {/* First to X legs */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl font-medium text-zinc-500 dark:text-zinc-400">
            Match Length
          </p>
          <div className="flex gap-4">
            {([1, 2, 3] as const).map((legs) => (
              <button
                key={legs}
                onClick={() => setFirstTo(legs)}
                className={`rounded-2xl px-10 py-5 text-2xl font-semibold transition-colors ${
                  firstTo === legs
                    ? "bg-green-600 text-white"
                    : "bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 purple:bg-purple-700 purple:text-purple-200 purple:hover:bg-purple-600"
                }`}
              >
                First to {legs}
              </button>
            ))}
          </div>
        </div>
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
