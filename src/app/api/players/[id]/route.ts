import { sqliteStatsStore } from "@/lib/stats-store-sqlite";

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/players/[id]">,
) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { name } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const player = sqliteStatsStore.getPlayer(id);
  if (!player) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }

  sqliteStatsStore.savePlayer({ ...player, name: name.trim() });
  return Response.json({ ...player, name: name.trim() });
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/players/[id]">,
) {
  const { id } = await ctx.params;
  sqliteStatsStore.deletePlayer(id);
  return Response.json({ ok: true });
}
