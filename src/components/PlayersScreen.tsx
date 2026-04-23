"use client";

import { useState, useEffect, useCallback } from "react";
import { usePlayerStore } from "@/hooks/usePlayerStore";

interface PlayerStats {
  ppr: number | null;
  winRate: number | null;
  legsPlayed: number;
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
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);

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
    <div className="flex flex-col h-full w-full">
      {/* Top Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b-2 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 purple:border-purple-900 purple:bg-purple-950">
        <button
          onClick={onBack}
          className="rounded-xl border-2 border-zinc-300 px-8 py-3 text-lg font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 purple:border-purple-700 purple:hover:bg-purple-900"
        >
          Back
        </button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold">Players</h1>
        </div>
        
        {/* Spacer for symmetry */}
        <div className="w-[100px]"></div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center gap-8 px-6 py-8 overflow-y-auto">
        <div className="grid grid-cols-2 w-full gap-3">
        {players.length === 0 && (
          <p className="py-6 text-center text-lg text-zinc-400 dark:text-zinc-500">
            No players yet — add one below
          </p>
        )}
        {players.map((player) => {
          const s = stats[player.id];
          return (
            <div
              key={player.id}
              onClick={() => onSelectPlayer(player.id)}
              className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-zinc-200 px-6 py-5 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500 purple:border-purple-700 purple:hover:border-purple-500"
            >
              <div className="flex-1">
                <span className="text-xl font-medium">{player.name}</span>
                {s && s.legsPlayed > 0 ? (
                  <div className="mt-2 flex gap-6 text-base text-zinc-500 dark:text-zinc-400 purple:text-purple-400">
                    <span>
                      PPR{" "}
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200 purple:text-purple-200">
                        {s.ppr != null ? s.ppr.toFixed(1) : "—"}
                      </span>
                    </span>
                    <span>
                      Win rate{" "}
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200 purple:text-purple-200">
                        {s.winRate != null ? `${s.winRate.toFixed(0)}%` : "—"}
                      </span>
                    </span>
                    <span>
                      Legs{" "}
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200 purple:text-purple-200">
                        {s.legsPlayed}
                      </span>
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-base text-zinc-400 dark:text-zinc-500 purple:text-purple-400">
                    No legs played
                  </p>
                )}
              </div>
              {confirmingDelete === player.id ? (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      handleDelete(player.id);
                      setConfirmingDelete(null);
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-red-500"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(null)}
                    className="rounded-lg bg-zinc-200 px-4 py-2 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 purple:bg-purple-700 purple:text-purple-200 purple:hover:bg-purple-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmingDelete(player.id); }}
                  className="text-2xl text-zinc-400 transition-colors hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-500 purple:text-purple-400 purple:hover:text-red-500"
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
        className="flex w-full max-w-2xl gap-3"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Player name"
          className="flex-1 rounded-xl border-2 border-zinc-200 bg-transparent px-6 py-4 text-lg outline-none focus:border-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-500 purple:border-purple-700 purple:focus:border-purple-500"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="rounded-xl bg-zinc-200 px-6 py-4 text-lg font-medium text-zinc-800 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 purple:bg-purple-700 purple:text-purple-200 purple:hover:bg-purple-600"
        >
          Add
        </button>
      </form>

      <div className="flex w-full max-w-2xl flex-col gap-4">
        {confirmingDeleteAll ? (
          <div className="flex flex-col gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
            <p className="text-lg font-medium text-red-900 dark:text-red-200">
              Delete all stats for all players?
            </p>
            <p className="text-base text-red-700 dark:text-red-300">
              This will permanently delete all game history, throws, and statistics. Players themselves will not be deleted.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={async () => {
                  await fetch("/api/stats/players", { method: "DELETE" });
                  setConfirmingDeleteAll(false);
                  await fetchStats();
                }}
                className="flex-1 rounded-xl bg-red-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-red-500"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setConfirmingDeleteAll(false)}
                className="flex-1 rounded-xl border-2 border-zinc-300 bg-white px-6 py-4 text-lg font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 purple:border-purple-800 purple:bg-purple-950 purple:hover:bg-purple-900"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDeleteAll(true)}
            className="rounded-xl border-2 border-red-300 px-6 py-4 text-lg font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete All Stats
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
