"use client";

import { useRef, useCallback } from "react";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useAutodartsPoller } from "@/hooks/useAutodartsPoller";
import { BoardControls } from "@/components/BoardControls";
import { HomeScreen } from "@/components/HomeScreen";
import { GameConfigScreen } from "@/components/GameConfigScreen";
import { PlayerSelectScreen } from "@/components/PlayerSelectScreen";
import { GameScreen } from "@/components/GameScreen";
import type { Segment } from "@/lib/types";

export function AppShell() {
  const { view, goHome, selectGame, configureGame, startGame } =
    useAppNavigation();

  const throwHandlerRef = useRef<((segment: Segment) => void) | null>(null);
  const takeoutHandlerRef = useRef<(() => void) | null>(null);

  const handleThrow = useCallback((segment: Segment) => {
    throwHandlerRef.current?.(segment);
  }, []);

  const handleTakeout = useCallback(() => {
    takeoutHandlerRef.current?.();
  }, []);

  const { boardRunning, resetTracking } = useAutodartsPoller({
    processThrows: view.screen === "playing",
    onThrowDetected: handleThrow,
    onTakeout: handleTakeout,
  });

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-center border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <BoardControls boardRunning={boardRunning} />
      </header>

      <main className="flex flex-1 flex-col px-4">
        {view.screen === "home" && (
          <HomeScreen onSelectGame={selectGame} />
        )}

        {view.screen === "game-config" && (
          <GameConfigScreen
            gameId={view.gameId}
            onContinue={(config) => configureGame(view.gameId, config)}
            onBack={goHome}
          />
        )}

        {view.screen === "player-select" && (
          <PlayerSelectScreen
            gameId={view.gameId}
            onStart={(playerIds) =>
              startGame(view.gameId, playerIds, view.config)
            }
            onBack={goHome}
          />
        )}

        {view.screen === "playing" && (
          <GameScreen
            gameId={view.gameId}
            playerIds={view.playerIds}
            config={view.config}
            onThrowDetected={(handler) => {
              throwHandlerRef.current = handler;
            }}
            onTakeout={(handler) => {
              takeoutHandlerRef.current = handler;
            }}
            onQuit={goHome}
            onPlayAgain={() => {
              resetTracking();
            }}
          />
        )}
      </main>
    </div>
  );
}
