import { sqliteStatsStore } from "@/lib/stats-store-sqlite";

export async function GET() {
  const players = sqliteStatsStore.getPlayers();
  return Response.json(players);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, name } = body;

  if (!name || typeof name !== "string") {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const player = {
    id: id ?? crypto.randomUUID(),
    name,
    created_at: new Date().toISOString(),
  };

  sqliteStatsStore.savePlayer(player);
  return Response.json(player, { status: 201 });
}
