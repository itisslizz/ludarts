"use client";

import { GAMES } from "@/lib/games";

interface HomeScreenProps {
  onSelectGame: (gameId: string) => void;
}

export function HomeScreen({ onSelectGame }: HomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold tracking-tight">Autodarts</h1>
      <div className="grid w-full max-w-md gap-4">
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            className="rounded-xl border border-zinc-200 bg-white p-6 text-left transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <h2 className="text-xl font-semibold">{game.name}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {game.description}
            </p>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              {game.minPlayers === game.maxPlayers
                ? `${game.minPlayers} player${game.minPlayers > 1 ? "s" : ""}`
                : `${game.minPlayers}–${game.maxPlayers} players`}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
