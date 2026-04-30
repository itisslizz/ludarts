import { sqliteStatsStore } from "@/lib/stats-store-sqlite";
import { computeTopBadgesBasic } from "@/lib/badges";

export async function GET() {
  const players = sqliteStatsStore.getPlayers();
  const result: Record<string, { ppr: number | null; winRate: number | null; legsPlayed: number; topBadgeIds: string[] }> = {};

  for (const player of players) {
    const stats = sqliteStatsStore.getPlayerX01Stats(player.id);
    const topBadgeIds = computeTopBadgesBasic(
      stats.legsPlayed,
      stats.ppr,
      stats.winRate,
      player.elo_rating ?? 1500,
    );
    result[player.id] = { ...stats, topBadgeIds };
  }

  return Response.json(result);
}

export async function DELETE() {
  sqliteStatsStore.clearAllStats();
  return Response.json({ ok: true });
}
