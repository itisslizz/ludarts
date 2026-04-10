"use client";

import { useState, useCallback, useEffect } from "react";
import type { Player } from "@/lib/types";
import type { PlayerStore } from "@/lib/player-store";
import { apiPlayerStore } from "@/lib/player-store";

const store: PlayerStore = apiPlayerStore;

export function usePlayerStore() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    store.getAll().then(setPlayers);
  }, []);

  const addPlayer = useCallback(async (name: string): Promise<Player> => {
    const player = await store.add(name);
    setPlayers((prev) => [...prev, player]);
    return player;
  }, []);

  const deletePlayer = useCallback(async (id: string) => {
    await store.remove(id);
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { players, addPlayer, deletePlayer };
}
