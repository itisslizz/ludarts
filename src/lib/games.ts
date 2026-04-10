import type { GameDefinition } from "@/lib/types";

export const GAMES: GameDefinition[] = [
  {
    id: "around-the-world",
    name: "Around The World",
    description: "Hit 1 through 20, then Bullseye",
    minPlayers: 1,
    maxPlayers: 1,
    hasConfig: false,
  },
  {
    id: "x01",
    name: "X01",
    description: "301, 501, or 701 — count down to zero",
    minPlayers: 1,
    maxPlayers: 6,
    hasConfig: true,
  },
  {
    id: "cricket",
    name: "Cricket",
    description: "Close 15–20 and Bull — outscore your opponent",
    minPlayers: 2,
    maxPlayers: 6,
    hasConfig: false,
  },
];

export function getGame(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}
