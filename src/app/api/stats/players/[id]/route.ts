import { sqliteStatsStore } from "@/lib/stats-store-sqlite";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const player = sqliteStatsStore.getPlayer(id);
  if (!player) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const gamesParam = url.searchParams.get("games");
  const gameLimit = gamesParam ? parseInt(gamesParam, 10) : undefined;

  const stats = sqliteStatsStore.getPlayerDetailStats(id, gameLimit || undefined);
  return Response.json({ player, stats });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  sqliteStatsStore.clearPlayerStats(id);
  return Response.json({ ok: true });
}
