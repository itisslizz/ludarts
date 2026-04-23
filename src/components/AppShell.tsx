"use client";

import { useRef, useCallback, useState } from "react";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useAutodartsPoller } from "@/hooks/useAutodartsPoller";
import { BoardControls } from "@/components/BoardControls";
import { HomeScreen } from "@/components/HomeScreen";
import { GameConfigScreen } from "@/components/GameConfigScreen";
import { PlayerSelectScreen } from "@/components/PlayerSelectScreen";
import { GameScreen } from "@/components/GameScreen";
import { PlayersScreen } from "@/components/PlayersScreen";
import { PlayerDetailScreen } from "@/components/PlayerDetailScreen";
import type { Segment } from "@/lib/types";

export function AppShell() {
  const { view, goHome, goPlayers, goPlayerDetail, selectGame, configureGame, startGame } =
    useAppNavigation();

  const throwHandlerRef = useRef<((segment: Segment, coords?: { x: number; y: number }) => void) | null>(null);
  const takeoutHandlerRef = useRef<(() => void) | null>(null);
  const undoHandlerRef = useRef<(() => void) | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  const handleThrow = useCallback((segment: Segment, coords?: { x: number; y: number }) => {
    throwHandlerRef.current?.(segment, coords);
  }, []);

  const handleTakeout = useCallback(() => {
    takeoutHandlerRef.current?.();
  }, []);

  const handleUndo = useCallback(() => {
    undoHandlerRef.current?.();
  }, []);

  const { boardRunning, resetTracking } = useAutodartsPoller({
    processThrows: view.screen === "playing",
    onThrowDetected: handleThrow,
    onTakeout: handleTakeout,
  });

  const handleGameStart = useCallback(async () => {
    resetTracking();
    await fetch("/api/autodarts/reset", { method: "POST" }).catch(() => {});
    
    // Auto-start board if it's stopped
    if (boardRunning === false) {
      await fetch("/api/autodarts/start", { method: "PUT" }).catch(() => {});
    }
  }, [boardRunning, resetTracking]);

  return (
    <div className="flex h-screen flex-col">
      {view.screen === "playing" && (
        <header className="flex items-center justify-center border-b-2 border-zinc-200 px-6 py-5 dark:border-zinc-800">
          <BoardControls 
            boardRunning={boardRunning}
            gameId={view.gameId}
            config={view.config}
            onQuit={goHome}
            onUndo={handleUndo}
            canUndo={canUndo}
          />
        </header>
      )}

      <main className="flex flex-1 flex-col px-6 py-8">
        {view.screen === "home" && (
          <HomeScreen onSelectGame={selectGame} onManagePlayers={goPlayers} />
        )}

        {view.screen === "players" && (
          <PlayersScreen onBack={goHome} onSelectPlayer={goPlayerDetail} />
        )}

        {view.screen === "player-detail" && (
          <PlayerDetailScreen playerId={view.playerId} onBack={goPlayers} />
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
            onUndo={(handler, canUndoState) => {
              undoHandlerRef.current = handler;
              setCanUndo(canUndoState);
            }}
            onQuit={goHome}
            onPlayAgain={handleGameStart}
            onMount={handleGameStart}
          />
        )}
      </main>
    </div>
  );
}
