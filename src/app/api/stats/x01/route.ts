import { sqliteStatsStore } from "@/lib/stats-store-sqlite";
import type { DbX01Game, DbX01GamePlayer, DbX01Dart } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");

  if (!playerId) {
    return Response.json({ error: "playerId is required" }, { status: 400 });
  }

  const games = sqliteStatsStore.getX01GamesForPlayer(playerId);
  return Response.json(games);
}

interface SaveX01Body {
  game: DbX01Game;
  players: DbX01GamePlayer[];
  darts: Omit<DbX01Dart, "id">[];
}

export async function POST(req: Request) {
  const body: SaveX01Body = await req.json();

  if (!body.game || !body.players || !body.darts) {
    return Response.json(
      { error: "game, players, and darts are required" },
      { status: 400 },
    );
  }

  sqliteStatsStore.saveX01Game(body.game, body.players, body.darts);
  
  // Fetch game players from database to get elo_change values
  const gamePlayersFromDb = sqliteStatsStore.getX01GamePlayers(body.game.id);
  
  // Fetch updated player data with Elo ratings and changes
  const playerData = body.players.map(p => {
    const player = sqliteStatsStore.getPlayer(p.player_id);
    const gamePlayer = gamePlayersFromDb.find((gp: DbX01GamePlayer) => gp.player_id === p.player_id);
    return {
      playerId: p.player_id,
      eloRating: player?.elo_rating ?? 1500,
      eloChange: gamePlayer?.elo_change ?? null,
    };
  });
  
  return Response.json({ ok: true, players: playerData }, { status: 201 });
}
