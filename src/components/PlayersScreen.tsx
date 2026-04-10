"use client";

import { useState, useEffect, useCallback } from "react";
import { usePlayerStore } from "@/hooks/usePlayerStore";

interface PlayerStats {
  ppr: number | null;
  winRate: number | null;
  gamesPlayed: number;
}

interface PlayersScreenProps {
  onBack: () => void;
  onSelectPlayer: (playerId: string) => void;
}

export function PlayersScreen({ onBack, onSelectPlayer }: PlayersScreenProps) {
  const { players, addPlayer, deletePlayer } = usePlayerStore();
  const [newName, setNewName] = useState("");
  const [stats, setStats] = useState<Record<string, PlayerStats>>({});
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/stats/players");
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    await addPlayer(trimmed);
    setNewName("");
  }

  async function handleDelete(id: string) {
    await deletePlayer(id);
    setStats((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-8">
      <h1 className="text-3xl font-bold">Players</h1>

      <div className="flex w-full max-w-md flex-col gap-2">
        {players.length === 0 && (
          <p className="py-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
            No players yet — add one below
          </p>
        )}
        {players.map((player) => {
          const s = stats[player.id];
          return (
            <div
              key={player.id}
              onClick={() => onSelectPlayer(player.id)}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
            >
              <div className="flex-1">
                <span className="font-medium">{player.name}</span>
                {s && s.gamesPlayed > 0 ? (
                  <div className="mt-1 flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>
                      PPR{" "}
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                        {s.ppr != null ? s.ppr.toFixed(1) : "—"}
                      </span>
                    </span>
                    <span>
                      Win rate{" "}
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                        {s.winRate != null ? `${s.winRate.toFixed(0)}%` : "—"}
                      </span>
                    </span>
                    <span>
                      Games{" "}
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                        {s.gamesPlayed}
                      </span>
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    No games played
                  </p>
                )}
              </div>
              {confirmingDelete === player.id ? (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      handleDelete(player.id);
                      setConfirmingDelete(null);
                    }}
                    className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(null)}
                    className="rounded bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmingDelete(player.id); }}
                  className="text-zinc-400 transition-colors hover:text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleAddPlayer}
        className="flex w-full max-w-md gap-2"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Player name"
          className="flex-1 rounded-lg border border-zinc-200 bg-transparent px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-500"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Add
        </button>
      </form>

      <button
        onClick={onBack}
        className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Back
      </button>
    </div>
  );
}
