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

const ALL_DOUBLES = [
  ...Array.from({ length: 20 }, (_, i) => `D${i + 1}`),
  "D-Bull",
];

export function PlayerDetailScreen({ playerId, onBack }: PlayerDetailScreenProps) {
  const [data, setData] = useState<PlayerDetailData | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [gameLimit, setGameLimit] = useState<number>(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showCheckouts, setShowCheckouts] = useState(false);
  const [showPpr, setShowPpr] = useState(false);
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

  if (showCheckouts) {
    const detailMap = new Map(stats.checkoutDetails.map((cd) => [cd.segment, cd]));
    const totalMade = stats.checkoutDetails.reduce((s, cd) => s + cd.made, 0);
    const totalAttempts = stats.checkoutDetails.reduce((s, cd) => s + cd.attempts, 0);
    const totalPct = totalAttempts > 0 ? Math.round((totalMade / totalAttempts) * 100) : null;
    return (
      <div className="flex flex-1 flex-col items-center gap-6 py-8">
        <h1 className="text-3xl font-bold">Checkout Details</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{player.name}</p>
        <div className="text-center">
          <p className="text-4xl font-bold tabular-nums">{totalPct !== null ? `${totalPct}%` : "—"}</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">{totalMade}/{totalAttempts}</p>
        </div>

        <div className="grid w-full max-w-md grid-cols-3 gap-2">
          {ALL_DOUBLES.map((seg) => {
            const cd = detailMap.get(seg);
            const made = cd?.made ?? 0;
            const attempts = cd?.attempts ?? 0;
            const pct = attempts > 0 ? Math.round((made / attempts) * 100) : null;
            return (
              <div
                key={seg}
                className="flex flex-col items-center rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
              >
                <span className="text-sm font-semibold">{seg}</span>
                <span className="mt-1 text-lg font-bold tabular-nums">
                  <span className={made > 0 ? "text-green-500" : ""}>{made}</span>
                  <span className="text-zinc-400">/{attempts}</span>
                </span>
                <span className="text-xs text-zinc-400 tabular-nums">
                  {pct !== null ? `${pct}%` : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setShowCheckouts(false)}
          className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Back
        </button>
      </div>
    );
  }

  if (showPpr) {
    const history = stats.pprHistory;
    return (
      <div className="flex flex-1 flex-col items-center gap-6 py-8">
        <h1 className="text-3xl font-bold">PPR Over Time</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{player.name}</p>

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

        {history.length > 1 ? (
          <PprChart data={history} />
        ) : (
          <p className="text-sm text-zinc-400">Not enough games for a chart</p>
        )}

        <button
          onClick={() => setShowPpr(false)}
          className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Back
        </button>
      </div>
    );
  }

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
        <StatCard label="PPR" value={stats.ppr != null ? stats.ppr.toFixed(1) : "—"} onClick={() => setShowPpr(true)} />
        <StatCard label="First 9 PPR" value={stats.first9Ppr != null ? stats.first9Ppr.toFixed(1) : "—"} onClick={() => setShowPpr(true)} />
        <StatCard label="Scoring PPR" value={stats.scoringPpr != null ? stats.scoringPpr.toFixed(1) : "—"} onClick={() => setShowPpr(true)} />
        <StatCard label="Win Rate" value={stats.winRate != null ? `${stats.winRate.toFixed(0)}%` : "—"} />
        <StatCard label="Games" value={String(stats.gamesPlayed)} />
        <StatCard label="Total Darts" value={String(stats.totalDarts)} />
        <StatCard label="Best Visit" value={stats.highestVisit != null ? String(stats.highestVisit) : "—"} />
        <StatCard label="Checkout %" value={stats.checkoutRate != null ? `${stats.checkoutRate.toFixed(0)}%` : "—"} onClick={() => setShowCheckouts(true)} />
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

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Back
        </button>
        {confirmClear ? (
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await fetch(`/api/stats/players/${playerId}`, { method: "DELETE" });
                setConfirmClear(false);
                const params = gameLimit ? `?games=${gameLimit}` : "";
                const res = await fetch(`/api/stats/players/${playerId}${params}`);
                if (res.ok) setData(await res.json());
              }}
              className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="rounded-full border border-red-300 px-6 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            Clear Stats
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-zinc-200 px-4 py-3 text-center dark:border-zinc-700 ${onClick ? "cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500" : ""}`}
    >
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

const CHART_COLORS = { ppr: "#3b82f6", first9Ppr: "#f59e0b", scoringPpr: "#10b981" };

function PprChart({ data }: { data: { date: string; ppr: number; first9Ppr: number; scoringPpr: number | null }[] }) {
  const W = 360, H = 200, PAD = { top: 10, right: 10, bottom: 30, left: 40 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const allVals = data.flatMap((d) => [d.ppr, d.first9Ppr, ...(d.scoringPpr != null ? [d.scoringPpr] : [])]);
  const minY = 0;
  const maxY = Math.max(20, ...allVals) * 1.1;

  function x(i: number) { return PAD.left + (i / (data.length - 1)) * cw; }
  function y(v: number) { return PAD.top + ch - ((v - minY) / (maxY - minY)) * ch; }

  function line(vals: (number | null)[]) {
    const pts = vals
      .map((v, i) => v != null ? `${x(i).toFixed(1)},${y(v).toFixed(1)}` : null)
      .filter(Boolean);
    return `M${pts.join("L")}`;
  }

  const gridLines = Array.from({ length: 5 }, (_, i) => minY + ((maxY - minY) * i) / 4);

  return (
    <div className="w-full max-w-md">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid */}
        {gridLines.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity={0.1} />
            <text x={PAD.left - 4} y={y(v) + 3} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.4}>
              {Math.round(v)}
            </text>
          </g>
        ))}

        {/* Lines */}
        <path d={line(data.map((d) => d.ppr))} fill="none" stroke={CHART_COLORS.ppr} strokeWidth={2} />
        <path d={line(data.map((d) => d.first9Ppr))} fill="none" stroke={CHART_COLORS.first9Ppr} strokeWidth={2} />
        <path d={line(data.map((d) => d.scoringPpr))} fill="none" stroke={CHART_COLORS.scoringPpr} strokeWidth={2} />
      </svg>

      {/* Legend */}
      <div className="mt-2 flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded" style={{ background: CHART_COLORS.ppr }} />
          PPR
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded" style={{ background: CHART_COLORS.first9Ppr }} />
          First 9
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded" style={{ background: CHART_COLORS.scoringPpr }} />
          Scoring
        </span>
      </div>
    </div>
  );
}
