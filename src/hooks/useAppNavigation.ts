"use client";

import { useState, useCallback } from "react";
import type { AppView } from "@/lib/types";

export function useAppNavigation() {
  const [view, setView] = useState<AppView>({ screen: "home" });

  const goHome = useCallback(() => setView({ screen: "home" }), []);

  const selectGame = useCallback(
    (gameId: string) => setView({ screen: "player-select", gameId }),
    [],
  );

  const startGame = useCallback(
    (gameId: string, playerIds: string[]) =>
      setView({ screen: "playing", gameId, playerIds }),
    [],
  );

  return { view, goHome, selectGame, startGame };
}
