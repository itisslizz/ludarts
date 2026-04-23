"use client";

import { GAMES } from "@/lib/games";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

interface HomeScreenProps {
  onSelectGame: (gameId: string) => void;
  onManagePlayers: () => void;
}

export function HomeScreen({ onSelectGame, onManagePlayers }: HomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-12">
      <h1 className="text-6xl font-bold tracking-tight">LuDarts</h1>
      <div className="grid grid-cols-3 w-full max-w-3xl gap-6">
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            className="rounded-2xl border-2 border-zinc-200 bg-white p-8 text-left transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 purple:border-purple-800 purple:bg-purple-950 purple:hover:border-purple-600"
          >
            <h2 className="text-3xl font-semibold">{game.name}</h2>
            <p className="mt-3 text-base text-zinc-400 dark:text-zinc-500 purple:text-purple-400">
              {game.minPlayers === game.maxPlayers
                ? `${game.minPlayers} player${game.minPlayers > 1 ? "s" : ""}`
                : `${game.minPlayers}–${game.maxPlayers} players`}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-6">
        <button
          onClick={onManagePlayers}
          className="rounded-2xl border-2 border-zinc-300 px-12 py-5 text-lg font-medium transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50 purple:border-purple-700 purple:hover:border-purple-500 purple:hover:bg-purple-900/50"
        >
          Manage Players
        </button>

        <div className="flex flex-col items-center gap-3">
          <p className="text-base text-zinc-500 dark:text-zinc-400 purple:text-purple-400">Theme</p>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
