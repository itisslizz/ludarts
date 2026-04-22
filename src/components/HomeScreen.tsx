"use client";

import { GAMES } from "@/lib/games";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

interface HomeScreenProps {
  onSelectGame: (gameId: string) => void;
  onManagePlayers: () => void;
}

export function HomeScreen({ onSelectGame, onManagePlayers }: HomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold tracking-tight">Autodarts</h1>
      <div className="grid w-full max-w-md gap-4">
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            className="rounded-xl border border-zinc-200 bg-white p-6 text-left transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 purple:border-purple-800 purple:bg-purple-950 purple:hover:border-purple-600"
          >
            <h2 className="text-xl font-semibold">{game.name}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 purple:text-purple-300">
              {game.description}
            </p>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 purple:text-purple-400">
              {game.minPlayers === game.maxPlayers
                ? `${game.minPlayers} player${game.minPlayers > 1 ? "s" : ""}`
                : `${game.minPlayers}–${game.maxPlayers} players`}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={onManagePlayers}
          className="rounded-xl border border-zinc-300 px-8 py-4 text-sm font-medium transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50 purple:border-purple-700 purple:hover:border-purple-500 purple:hover:bg-purple-900/50"
        >
          Manage Players
        </button>

        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 purple:text-purple-400">Theme</p>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
