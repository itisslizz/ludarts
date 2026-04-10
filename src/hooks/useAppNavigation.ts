"use client";

import { useState, useCallback } from "react";
import { getGame } from "@/lib/games";
import type { AppView, GameConfig } from "@/lib/types";

export function useAppNavigation() {
  const [view, setView] = useState<AppView>({ screen: "home" });

  const goHome = useCallback(() => setView({ screen: "home" }), []);
  const goPlayers = useCallback(() => setView({ screen: "players" }), []);
  const goPlayerDetail = useCallback(
    (playerId: string) => setView({ screen: "player-detail", playerId }),
    [],
  );

  const selectGame = useCallback((gameId: string) => {
    const game = getGame(gameId);
    if (game?.hasConfig) {
      setView({ screen: "game-config", gameId });
    } else {
      setView({ screen: "player-select", gameId, config: {} });
    }
  }, []);

  const configureGame = useCallback(
    (gameId: string, config: GameConfig) =>
      setView({ screen: "player-select", gameId, config }),
    [],
  );

  const startGame = useCallback(
    (gameId: string, playerIds: string[], config: GameConfig) =>
      setView({ screen: "playing", gameId, playerIds, config }),
    [],
  );

  return { view, goHome, goPlayers, goPlayerDetail, selectGame, configureGame, startGame };
}
