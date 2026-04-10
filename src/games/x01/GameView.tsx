"use client";

import { useRef, useEffect } from "react";
import { useX01GameLogic } from "./useGameLogic";
import { computeStats } from "./stats";
import { saveX01Game } from "./saveGame";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { ScorePicker } from "@/components/ScorePicker";
import type { Segment, X01Config, X01ThrowRecord } from "@/lib/types";

interface X01GameViewProps {
  config: X01Config;
  playerIds: string[];
  onThrowDetected: (handler: (segment: Segment, coords?: { x: number; y: number }) => void) => void;
  onTakeout: (handler: () => void) => void;
  onQuit: () => void;
  onPlayAgain: () => void;
}

function ThrowBadge({ record }: { record: X01ThrowRecord }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm font-medium ${
        record.busted
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "bg-zinc-200/50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {record.segment.name.toUpperCase()}
      {!record.busted && (
        <span className="text-xs text-zinc-400">({record.points})</span>
      )}
    </span>
  );
}

function VisitHistory({
  visits,
  playerName,
}: {
  visits: X01ThrowRecord[][];
  playerName?: string;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      {[...visits].reverse().map((visit, ri) => {
        const visitIndex = visits.length - 1 - ri;
        const visitTotal = visit.reduce((s, t) => s + t.points, 0);
        const busted = visit.some((t) => t.busted);

        return (
          <div
            key={visitIndex}
            className="flex items-center gap-3 rounded-lg bg-zinc-100 px-3 py-1.5 dark:bg-zinc-900"
          >
            {playerName && (
              <span className="w-16 truncate text-xs font-medium text-zinc-400 dark:text-zinc-500">
                {playerName}
              </span>
            )}
            <div className="flex flex-1 gap-2">
              {visit.map((record, ti) => (
                <ThrowBadge key={visitIndex * 3 + ti} record={record} />
              ))}
            </div>
            <span
              className={`text-sm font-semibold ${
                busted
                  ? "text-red-500"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {busted ? "BUST" : visitTotal}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function X01GameView({
  config,
  playerIds,
  onThrowDetected,
  onTakeout,
  onQuit,
  onPlayAgain,
}: X01GameViewProps) {
  const { state, registerThrow, endTurn, undo, reset } = useX01GameLogic(config, playerIds);
  const { players: allPlayers } = usePlayerStore();
  const savedRef = useRef(false);

  onThrowDetected(registerThrow);
  onTakeout(endTurn);

  // Save completed game to DB
  useEffect(() => {
    if (state.phase === "complete" && !savedRef.current) {
      savedRef.current = true;
      saveX01Game(state).catch(() => {});
    }
    if (state.phase === "playing") {
      savedRef.current = false;
    }
  }, [state.phase, state]);

  const playerName = (id: string) =>
    allPlayers.find((p) => p.id === id)?.name ?? "Unknown";

  if (state.phase === "complete") {
    const playerStats = state.players.map((ps) => ({
      ...ps,
      stats: computeStats(ps, state.targetScore),
      name: playerName(ps.playerId),
      isWinner: ps.playerId === state.winnerId,
    }));

    return (
      <div className="flex flex-1 flex-col items-center gap-8 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            {state.winnerId ? `${playerName(state.winnerId)} wins!` : "Game Complete!"}
          </h1>
          <p className="mt-2 text-lg text-zinc-500 dark:text-zinc-400">
            {state.targetScore} &middot; {state.outMode === "double" ? "Double Out" : "Straight Out"}
          </p>
        </div>

        {/* Player stats cards */}
        <div className={`grid w-full max-w-3xl gap-4 ${
          playerStats.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
        }`}>
          {playerStats.map(({ playerId, name, isWinner, stats }) => (
            <div
              key={playerId}
              className={`rounded-xl px-6 py-5 ${
                isWinner
                  ? "bg-green-500/10 border-2 border-green-500"
                  : "bg-zinc-100 dark:bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold">{name}</span>
                {isWinner && (
                  <span className="rounded-full bg-green-500 px-3 py-0.5 text-xs font-semibold text-white">
                    Winner
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-y-4 gap-x-6 text-center">
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.ppr.toFixed(1)}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">PPR</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.first9Ppr.toFixed(1)}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">First 9 PPR</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.checkoutRate}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Checkout</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.visits60}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">60+</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.visits100}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">100+</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.visits140}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">140+</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.visits180}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">180s</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.totalDarts}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Darts</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onQuit}
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Home
          </button>
          <button
            onClick={() => {
              reset();
              onPlayAgain();
            }}
            className="rounded-full bg-green-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-500 active:bg-green-700"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Playing phase
  const currentPlayer = state.players[state.currentPlayerIndex];
  const visitTotal = state.currentVisit.reduce((s, t) => s + t.points, 0);
  const isMultiplayer = state.playerIds.length > 1;

  // Interleave all visits for the combined history
  const allVisits: { visit: X01ThrowRecord[]; playerId: string }[] = [];
  if (isMultiplayer) {
    const maxVisits = Math.max(...state.players.map((p) => p.visits.length));
    for (let round = 0; round < maxVisits; round++) {
      for (const ps of state.players) {
        if (round < ps.visits.length) {
          allVisits.push({ visit: ps.visits[round], playerId: ps.playerId });
        }
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-6">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <button
          onClick={onQuit}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Quit
        </button>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {state.outMode === "double" ? "Double Out" : "Straight Out"}
        </p>
      </div>

      {/* Scoreboard */}
      <div className={`grid w-full max-w-3xl gap-2 ${
        isMultiplayer ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
      }`}>
        {state.players.map((ps, i) => {
          const totalDarts = ps.visits.reduce((sum, v) => sum + v.length, 0);
          const totalPoints = state.targetScore - ps.score;
          const ppr = totalDarts > 0 ? (totalPoints / (totalDarts / 3)).toFixed(1) : "—";
          const lastVisit = ps.visits.length > 0 ? ps.visits[ps.visits.length - 1] : null;
          const lastVisitScore = lastVisit
            ? lastVisit.reduce((sum, t) => sum + t.points, 0)
            : null;

          return (
            <div
              key={ps.playerId}
              className={`flex flex-col items-center rounded-lg px-4 py-3 ${
                i === state.currentPlayerIndex
                  ? "bg-yellow-400/15 border-2 border-yellow-400"
                  : "bg-zinc-100 dark:bg-zinc-900"
              }`}
            >
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate w-full text-center">
                {playerName(ps.playerId)}
              </span>
              <span className="text-3xl font-bold tabular-nums">{ps.score}</span>
              <div className="flex gap-3 mt-1 text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                <span>Last: {lastVisitScore !== null ? lastVisitScore : "—"}</span>
                <span>PPR: {ppr}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current player & visit */}
      {isMultiplayer && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {playerName(currentPlayer.playerId)}&apos;s turn
        </p>
      )}

      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {state.currentVisit.map((record, i) => (
            <ThrowBadge key={i} record={record} />
          ))}
          {Array.from({ length: 3 - state.currentVisit.length }).map((_, i) => (
            <span
              key={`empty-${i}`}
              className="inline-flex h-7 w-12 items-center justify-center rounded border border-dashed border-zinc-300 text-xs text-zinc-400 dark:border-zinc-700"
            >
              —
            </span>
          ))}
        </div>
        {state.busted ? (
          <span className="text-sm font-bold text-red-500">BUST</span>
        ) : visitTotal > 0 ? (
          <span className="text-sm font-semibold text-zinc-500">
            {visitTotal}
          </span>
        ) : null}
      </div>

      {/* Undo button */}
      <button
        onClick={undo}
        disabled={state.throwCount === 0}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Undo Last Throw
      </button>

      {/* Manual score entry */}
      <ScorePicker onSelect={registerThrow} />

      {/* Visit history */}
      <div className="w-full max-w-3xl overflow-y-auto max-h-48">
        {isMultiplayer ? (
          <div className="flex flex-col gap-1">
            {[...allVisits].reverse().map((entry, i) => {
              const visitTotal = entry.visit.reduce((s, t) => s + t.points, 0);
              const busted = entry.visit.some((t) => t.busted);
              return (
                <div
                  key={allVisits.length - 1 - i}
                  className="flex items-center gap-3 rounded-lg bg-zinc-100 px-3 py-1.5 dark:bg-zinc-900"
                >
                  <span className="w-16 truncate text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    {playerName(entry.playerId)}
                  </span>
                  <div className="flex flex-1 gap-2">
                    {entry.visit.map((record, ti) => (
                      <ThrowBadge key={ti} record={record} />
                    ))}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      busted ? "text-red-500" : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {busted ? "BUST" : visitTotal}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <VisitHistory visits={state.players[0].visits} />
        )}
      </div>

    </div>
  );
}
