import type { X01State, DbX01Game, DbX01GamePlayer, DbX01Dart } from "@/lib/types";

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function saveX01Game(state: X01State): Promise<void> {
  const gameId = generateId();
  const now = new Date().toISOString();

  const game: DbX01Game = {
    id: gameId,
    target_score: state.targetScore,
    out_mode: state.outMode,
    started_at: now, // approximate — we don't track start time yet
    finished_at: now,
    winner_id: state.winnerId,
  };

  const players: DbX01GamePlayer[] = state.playerIds.map((pid, i) => ({
    game_id: gameId,
    player_id: pid,
    position: i,
  }));

  const darts: Omit<DbX01Dart, "id">[] = [];

  for (const ps of state.players) {
    for (let visitIdx = 0; visitIdx < ps.visits.length; visitIdx++) {
      const visit = ps.visits[visitIdx];
      for (let dartIdx = 0; dartIdx < visit.length; dartIdx++) {
        const t = visit[dartIdx];
        darts.push({
          game_id: gameId,
          player_id: ps.playerId,
          visit_number: visitIdx + 1,
          dart_index: dartIdx + 1,
          segment_name: t.segment.name,
          segment_number: t.segment.number,
          segment_multiplier: t.segment.multiplier,
          score: t.points,
          is_bust: t.busted ? 1 : 0,
          coord_x: t.coords?.x ?? null,
          coord_y: t.coords?.y ?? null,
        });
      }
    }
  }

  await fetch("/api/stats/x01", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game, players, darts }),
  });
}
