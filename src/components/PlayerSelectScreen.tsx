"use client";

import { useState } from "react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { getGame } from "@/lib/games";

interface PlayerSelectScreenProps {
  gameId: string;
  onStart: (playerIds: string[]) => void;
  onBack: () => void;
}

export function PlayerSelectScreen({
  gameId,
  onStart,
  onBack,
}: PlayerSelectScreenProps) {
  const game = getGame(gameId);
  const { players, addPlayer } = usePlayerStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState("");

  const isSingleSelect = game?.maxPlayers === 1;

  function togglePlayer(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (isSingleSelect) {
          return new Set([id]);
        }
        if (game && next.size >= game.maxPlayers) return prev;
        next.add(id);
      }
      return next;
    });
  }

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    const player = await addPlayer(trimmed);
    setNewName("");
    if (isSingleSelect) {
      setSelected(new Set([player.id]));
    } else if (!game || selected.size < game.maxPlayers) {
      setSelected((prev) => new Set(prev).add(player.id));
    }
  }

  const canStart =
    game != null &&
    selected.size >= game.minPlayers &&
    selected.size <= game.maxPlayers;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{game?.name ?? "Unknown Game"}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Select{" "}
          {isSingleSelect
            ? "a player"
            : `${game?.minPlayers}–${game?.maxPlayers} players`}
        </p>
      </div>

      {/* Player list */}
      <div className="flex w-full max-w-sm flex-col gap-2">
        {players.length === 0 && (
          <p className="py-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
            No players yet — add one below
          </p>
        )}
        {players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors cursor-pointer ${
              selected.has(player.id)
                ? "border-green-500 bg-green-500/10"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
            }`}
            onClick={() => togglePlayer(player.id)}
          >
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs ${
                selected.has(player.id)
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-zinc-300 dark:border-zinc-600"
              }`}
            >
              {selected.has(player.id) && "✓"}
            </div>
            <span className="flex-1 font-medium">{player.name}</span>
          </div>
        ))}
      </div>

      {/* Add player form */}
      <form
        onSubmit={handleAddPlayer}
        className="flex w-full max-w-sm gap-2"
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

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Back
        </button>
        <button
          onClick={() => onStart([...selected])}
          disabled={!canStart}
          className="rounded-full bg-green-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
