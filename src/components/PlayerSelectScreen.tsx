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
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [newName, setNewName] = useState("");

  const isSingleSelect = game?.maxPlayers === 1;

  function addToSelected(id: string) {
    if (selectedPlayerIds.includes(id)) return;
    if (game && selectedPlayerIds.length >= game.maxPlayers) return;
    
    setSelectedPlayerIds((prev) => 
      isSingleSelect ? [id] : [...prev, id]
    );
  }

  function removeFromSelected(id: string) {
    setSelectedPlayerIds((prev) => prev.filter((pid) => pid !== id));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setSelectedPlayerIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === selectedPlayerIds.length - 1) return;
    setSelectedPlayerIds((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    const player = await addPlayer(trimmed);
    setNewName("");
    
    // Auto-select if under max
    if (!game || selectedPlayerIds.length < game.maxPlayers) {
      addToSelected(player.id);
    }
  }

  const canStart =
    game != null &&
    selectedPlayerIds.length >= game.minPlayers &&
    selectedPlayerIds.length <= game.maxPlayers;

  return (
    <div className="flex flex-1 flex-col items-center gap-8 py-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold">{game?.name ?? "Unknown Game"}</h1>
        <p className="mt-3 text-xl text-zinc-500 dark:text-zinc-400">
          Select{" "}
          {isSingleSelect
            ? "a player"
            : `${game?.minPlayers}–${game?.maxPlayers} players`}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex w-full max-w-5xl gap-8">
        {/* Left: Available players */}
        <div className="flex flex-1 flex-col gap-4">
          <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300 purple:text-purple-200">
            Available Players
          </h2>
          
          <div className="flex flex-col gap-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900 purple:border-purple-700 purple:bg-purple-950">
            {players.length === 0 ? (
              <p className="py-6 text-center text-lg text-zinc-400 dark:text-zinc-500">
                No players yet
              </p>
            ) : (
              players
                .filter((p) => !selectedPlayerIds.includes(p.id))
                .map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-4 rounded-xl border-2 border-zinc-200 bg-white px-6 py-4 text-lg transition-colors cursor-pointer hover:border-green-500 hover:bg-green-500/5 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-green-500 purple:border-purple-700 purple:bg-purple-900 purple:hover:border-green-500"
                    onClick={() => addToSelected(player.id)}
                  >
                    <span className="flex-1 font-medium">{player.name}</span>
                    <span className="text-base text-zinc-400">+</span>
                  </div>
                ))
            )}
            
            {players.length > 0 && players.every((p) => selectedPlayerIds.includes(p.id)) && (
              <p className="py-6 text-center text-lg text-zinc-400 dark:text-zinc-500">
                All players selected
              </p>
            )}
          </div>

          {/* Add player form */}
          <form onSubmit={handleAddPlayer} className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Add new player"
              className="flex-1 rounded-xl border-2 border-zinc-200 bg-white px-6 py-4 text-lg outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-500 purple:border-purple-700 purple:bg-purple-900 purple:focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="rounded-xl bg-zinc-200 px-6 py-4 text-lg font-medium text-zinc-800 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 purple:bg-purple-800 purple:text-purple-100 purple:hover:bg-purple-700"
            >
              Add
            </button>
          </form>
        </div>

        {/* Right: Selected players (ordered) */}
        <div className="flex flex-1 flex-col gap-4">
          <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300 purple:text-purple-200">
            Selected Players {selectedPlayerIds.length > 0 && `(${selectedPlayerIds.length})`}
          </h2>
          
          <div className="flex flex-col gap-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 p-4 min-h-[300px] dark:border-zinc-700 dark:bg-zinc-900 purple:border-purple-700 purple:bg-purple-950">
            {selectedPlayerIds.length === 0 ? (
              <p className="py-6 text-center text-lg text-zinc-400 dark:text-zinc-500">
                Click players to add them here
              </p>
            ) : (
              selectedPlayerIds.map((playerId, index) => {
                const player = players.find((p) => p.id === playerId);
                if (!player) return null;
                
                return (
                  <div
                    key={playerId}
                    className="flex items-center gap-3 rounded-xl border-2 border-green-500 bg-green-500/10 px-5 py-4"
                  >
                    <span className="text-lg font-semibold text-zinc-500 dark:text-zinc-400 purple:text-purple-300 w-8">
                      {index + 1}.
                    </span>
                    <span className="flex-1 text-lg font-medium">{player.name}</span>
                    
                    {/* Reorder buttons */}
                    {!isSingleSelect && selectedPlayerIds.length > 1 && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-zinc-300 text-lg transition-colors hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-600 dark:hover:bg-zinc-800 purple:border-purple-600 purple:hover:bg-purple-800"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(index)}
                          disabled={index === selectedPlayerIds.length - 1}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-zinc-300 text-lg transition-colors hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-600 dark:hover:bg-zinc-800 purple:border-purple-600 purple:hover:bg-purple-800"
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>
                    )}
                    
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeFromSelected(playerId)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-red-300 text-xl text-red-600 transition-colors hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-6">
        <button
          onClick={onBack}
          className="rounded-2xl border-2 border-zinc-300 px-10 py-5 text-xl font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 purple:border-purple-700 purple:hover:bg-purple-900"
        >
          Back
        </button>
        <button
          onClick={() => onStart(selectedPlayerIds)}
          disabled={!canStart}
          className="rounded-2xl bg-green-600 px-12 py-5 text-2xl font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
