import type { DbPlayer, DbX01Game, DbX01Dart, DbX01GamePlayer } from "./types";

export interface StatsStore {
  // Players
  getPlayers(): DbPlayer[];
  getPlayer(id: string): DbPlayer | undefined;
  savePlayer(player: DbPlayer): void;
  deletePlayer(id: string): void;

  // X01 games
  saveX01Game(
    game: DbX01Game,
    players: DbX01GamePlayer[],
    darts: Omit<DbX01Dart, "id">[],
  ): void;
  getX01GamesForPlayer(playerId: string): DbX01Game[];
  getX01DartsForGame(gameId: string): DbX01Dart[];

  // Stats
  getPlayerX01Stats(playerId: string): { ppr: number | null; winRate: number | null; gamesPlayed: number };
  getPlayerDetailStats(playerId: string, gameLimit?: number): PlayerDetailStats;
  clearPlayerStats(playerId: string): void;
}

export interface CheckoutDetail {
  segment: string;
  made: number;
  attempts: number;
}

export interface PlayerDetailStats {
  ppr: number | null;
  first9Ppr: number | null;
  scoringPpr: number | null;
  winRate: number | null;
  gamesPlayed: number;
  totalDarts: number;
  highestVisit: number | null;
  checkoutRate: number | null;
  tons: number;
  ton40s: number;
  ton80s: number;
  checkoutDetails: CheckoutDetail[];
  pprHistory: { date: string; ppr: number; first9Ppr: number; scoringPpr: number | null }[];
  recentGames: { id: string; targetScore: number; outMode: string; startedAt: string; won: boolean; ppr: number }[];
  darts: { x: number; y: number }[];
}
