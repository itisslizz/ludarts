"use client";

import { useState, useEffect, useRef } from "react";
import { DartHeatmap } from "@/components/DartHeatmap";
import type { PlayerDetailStats } from "@/lib/stats-store";

interface PlayerDetailScreenProps {
  playerId: string;
  onBack: () => void;
}

interface PlayerDetailData {
  player: { id: string; name: string };
  stats: PlayerDetailStats;
}

const GAME_LIMITS = [10, 100, 0] as const;
const GAME_LIMIT_LABELS: Record<number, string> = { 10: "Last 10", 100: "Last 100", 0: "All Time" };

export function PlayerDetailScreen({ playerId, onBack }: PlayerDetailScreenProps) {
  const [data, setData] = useState<PlayerDetailData | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [gameLimit, setGameLimit] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = gameLimit ? `?games=${gameLimit}` : "";
    fetch(`/api/stats/players/${playerId}${params}`)
      .then((r) => r.json())
      .then(setData);
  }, [playerId, gameLimit]);

  function startEditing() {
    if (!data) return;
    setEditName(data.player.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function saveName() {
    const trimmed = editName.trim();
    if (!trimmed || !data || trimmed === data.player.name) {
      setEditing(false);
      return;
    }
    const res = await fetch(`/api/players/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      setData({ ...data, player: { ...data.player, name: trimmed } });
    }
    setEditing(false);
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  const { player, stats } = data;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-8">
      {editing ? (
        <form
          onSubmit={(e) => { e.preventDefault(); saveName(); }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={saveName}
            className="border-b-2 border-zinc-400 bg-transparent text-center text-3xl font-bold outline-none focus:border-zinc-600 dark:border-zinc-500 dark:focus:border-zinc-300"
          />
        </form>
      ) : (
        <h1
          onClick={startEditing}
          className="cursor-pointer text-3xl font-bold hover:text-zinc-500 dark:hover:text-zinc-400"
          title="Click to edit"
        >
          {player.name}
        </h1>
      )}

      {/* Game limit toggle */}
      <div className="flex gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
        {GAME_LIMITS.map((limit) => (
          <button
            key={limit}
            onClick={() => setGameLimit(limit)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              gameLimit === limit
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {GAME_LIMIT_LABELS[limit]}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="PPR" value={stats.ppr != null ? stats.ppr.toFixed(1) : "—"} />
        <StatCard label="Win Rate" value={stats.winRate != null ? `${stats.winRate.toFixed(0)}%` : "—"} />
        <StatCard label="Games" value={String(stats.gamesPlayed)} />
        <StatCard label="Total Darts" value={String(stats.totalDarts)} />
        <StatCard label="Best Visit" value={stats.highestVisit != null ? String(stats.highestVisit) : "—"} />
        <StatCard label="Checkout %" value={stats.checkoutRate != null ? `${stats.checkoutRate.toFixed(0)}%` : "—"} />
        <StatCard label="100+" value={String(stats.tons)} />
        <StatCard label="140+" value={String(stats.ton40s)} />
        <StatCard label="180s" value={String(stats.ton80s)} />
      </div>

      {/* Heatmap */}
      {stats.darts.length > 0 && (
        <div className="w-full max-w-md">
          <h2 className="mb-2 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Dart Heatmap ({stats.darts.length} darts)
          </h2>
          <DartHeatmap darts={stats.darts} />
        </div>
      )}

      {/* Recent games */}
      {stats.recentGames.length > 0 && (
        <div className="w-full max-w-md">
          <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Recent Games
          </h2>
          <div className="flex flex-col gap-1">
            {stats.recentGames.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${g.won ? "bg-green-500" : "bg-zinc-400"}`}
                  />
                  <span className="font-medium">
                    {g.targetScore} {g.outMode}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>PPR {g.ppr.toFixed(1)}</span>
                  <span>{new Date(g.startedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onBack}
        className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Back
      </button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 px-4 py-3 text-center dark:border-zinc-700">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
