"use client";

import { BoardControls } from "@/components/BoardControls";

interface StartScreenProps {
  onStart: () => void;
  boardRunning: boolean | null;
}

export function StartScreen({ onStart, boardRunning }: StartScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">Around The World</h1>
        <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
          Hit 1 through 20, then Bullseye
        </p>
      </div>
      <BoardControls boardRunning={boardRunning} />
      <button
        onClick={onStart}
        className="rounded-full bg-green-600 px-10 py-4 text-xl font-semibold text-white transition-colors hover:bg-green-500 active:bg-green-700"
      >
        Start Game
      </button>
    </div>
  );
}
