import { sqliteStatsStore } from "@/lib/stats-store-sqlite";

export async function GET() {
  const entries = sqliteStatsStore.getLeaderboardStats();
  return Response.json(entries);
}
