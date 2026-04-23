"use client";

import { useCallback, useState } from "react";
import type { GameConfig, X01Config } from "@/lib/types";

interface BoardControlsProps {
  boardRunning: boolean | null;
  gameId: string;
  config: GameConfig;
  onQuit: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

async function boardAction(action: string, method: "PUT" | "POST") {
  const res = await fetch(`/api/autodarts/${action}`, { method });
  return res.ok;
}

export function BoardControls({ boardRunning, gameId, config, onQuit, onUndo, canUndo }: BoardControlsProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [showQuitModal, setShowQuitModal] = useState(false);

  const handleAction = useCallback(
    async (action: string, method: "PUT" | "POST") => {
      setBusy(action);
      try {
        await boardAction(action, method);
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const handleQuitClick = () => {
    setShowQuitModal(true);
  };

  const handleQuitConfirm = () => {
    setShowQuitModal(false);
    onQuit();
  };

  const handleQuitCancel = () => {
    setShowQuitModal(false);
  };

  // Get out mode and target score for X01 games
  const x01Config = gameId === "x01" ? (config as unknown as X01Config) : null;

  return (
    <>
      <div className="flex w-full items-center justify-between">
        {/* Left: Board controls */}
        <div className="flex gap-3">
          {!boardRunning && (
            <button
              onClick={() => handleAction("start", "PUT")}
              disabled={busy !== null || boardRunning === null}
              className="rounded-lg bg-green-600 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
            >
              {busy === "start" ? "Starting…" : "Start Board"}
            </button>
          )}
          {boardRunning && (
            <button
              onClick={() => handleAction("reset", "POST")}
              disabled={busy !== null}
              className="rounded-lg bg-zinc-200 px-6 py-3 text-lg font-medium text-zinc-800 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 purple:bg-purple-900 purple:text-purple-200 purple:hover:bg-purple-800"
            >
              {busy === "reset" ? "Resetting…" : "Reset Board"}
            </button>
          )}
        </div>

        {/* Center: Out mode for X01 */}
        <div className="flex flex-col items-center gap-1">
          {x01Config && (
            <p className="text-xl font-medium text-zinc-700 dark:text-zinc-300 purple:text-purple-300">
              {x01Config.baseScore} - {x01Config.outMode === "double" ? "Double Out" : "Straight Out"}
            </p>
          )}
        </div>

        {/* Right: Undo and Quit buttons */}
        <div className="flex gap-3">
          {onUndo && (
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="rounded-lg border-2 border-zinc-300 px-6 py-3 text-lg font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800 purple:border-purple-700 purple:hover:bg-purple-900"
            >
              Undo
            </button>
          )}
          <button
            onClick={handleQuitClick}
            className="rounded-lg bg-red-600 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-red-500"
          >
            Quit
          </button>
        </div>
      </div>

      {/* Quit Confirmation Modal */}
      {showQuitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleQuitCancel}>
          <div className="bg-white dark:bg-zinc-900 purple:bg-purple-950 rounded-2xl p-8 shadow-2xl max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100 purple:text-purple-300">Quit Game?</h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 purple:text-purple-400 mb-6">
              Are you sure you want to quit? Your progress will be lost.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleQuitCancel}
                className="rounded-lg border-2 border-zinc-300 px-6 py-3 text-lg font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 purple:border-purple-700 purple:hover:bg-purple-900"
              >
                Cancel
              </button>
              <button
                onClick={handleQuitConfirm}
                className="rounded-lg bg-red-600 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-red-500"
              >
                Quit Game
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
