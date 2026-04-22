import { sqliteStatsStore } from "@/lib/stats-store-sqlite";

export async function GET() {
  const players = sqliteStatsStore.getPlayers();
  const stats: Record<string, { ppr: number | null; winRate: number | null; legsPlayed: number }> = {};

  for (const player of players) {
    stats[player.id] = sqliteStatsStore.getPlayerX01Stats(player.id);
  }

  return Response.json(stats);
}

export async function DELETE() {
  sqliteStatsStore.clearAllStats();
  return Response.json({ ok: true });
}
