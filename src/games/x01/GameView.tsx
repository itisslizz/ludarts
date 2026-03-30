"use client";

import { useX01GameLogic } from "./useGameLogic";
import type { Segment, X01Config, X01ThrowRecord } from "@/lib/types";

interface X01GameViewProps {
  config: X01Config;
  onThrowDetected: (handler: (segment: Segment) => void) => void;
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

function VisitHistory({ visits }: { visits: X01ThrowRecord[][] }) {
  return (
    <div className="flex w-full max-w-md flex-col gap-2 overflow-y-auto max-h-56">
      {[...visits].reverse().map((visit, ri) => {
        const visitIndex = visits.length - 1 - ri;
        const visitTotal = visit.reduce((s, t) => s + t.points, 0);
        const busted = visit.some((t) => t.busted);

        return (
          <div
            key={visitIndex}
            className="flex items-center gap-3 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-900"
          >
            <span className="w-6 text-xs font-medium text-zinc-400 dark:text-zinc-500">
              R{visitIndex + 1}
            </span>
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
  onThrowDetected,
  onQuit,
  onPlayAgain,
}: X01GameViewProps) {
  const { state, registerThrow, reset } = useX01GameLogic(config);

  onThrowDetected(registerThrow);

  if (state.phase === "complete") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Game Complete!</h1>
          <p className="mt-2 text-lg text-zinc-500 dark:text-zinc-400">
            {state.targetScore} finished in {state.throwCount} darts
          </p>
        </div>
        <VisitHistory visits={state.visits} />
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

  const visitTotal = state.currentVisit.reduce((s, t) => s + t.points, 0);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-6">
      <div className="flex w-full max-w-md items-center justify-between">
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

      {/* Score display */}
      <div className="text-center">
        <p className="text-6xl font-bold tabular-nums">{state.score}</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          remaining
        </p>
      </div>

      {/* Current visit */}
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

      <VisitHistory visits={state.visits} />
    </div>
  );
}
