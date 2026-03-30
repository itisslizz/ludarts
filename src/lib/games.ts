import type { GameDefinition } from "@/lib/types";

export const GAMES: GameDefinition[] = [
  {
    id: "around-the-world",
    name: "Around The World",
    description: "Hit 1 through 20, then Bullseye",
    minPlayers: 1,
    maxPlayers: 1,
  },
];

export function getGame(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}
