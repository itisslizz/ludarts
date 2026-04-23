"use client";

import type { ATWThrowRecord } from "@/lib/types";

interface ThrowHistoryProps {
  history: ATWThrowRecord[];
  throwCount: number;
}

function ThrowBadge({ record }: { record: ATWThrowRecord }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm font-medium ${
        record.hit
          ? "bg-green-500/15 text-green-600 dark:text-green-400"
          : "bg-red-500/15 text-red-600 dark:text-red-400"
      }`}
    >
      {record.segment.name.toUpperCase()}
    </span>
  );
}

export function ThrowHistory({ history, throwCount }: ThrowHistoryProps) {
  const hits = history.filter((r) => r.hit).length;
  const accuracy = throwCount > 0 ? Math.round((hits / throwCount) * 100) : 0;

  // Group throws into rounds of 3
  const rounds: ATWThrowRecord[][] = [];
  for (let i = 0; i < history.length; i += 3) {
    rounds.push(history.slice(i, i + 3));
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="flex gap-6 text-sm text-zinc-500 dark:text-zinc-400">
        <span>Throws: {throwCount}</span>
        <span>Hits: {hits}</span>
        <span>Accuracy: {accuracy}%</span>
      </div>
      <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
        {[...rounds].reverse().map((round, ri) => {
          const roundIndex = rounds.length - 1 - ri;
          return (
            <div
              key={roundIndex}
              className="flex items-center gap-3 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-900 purple:bg-purple-950"
            >
              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 w-6">
                R{roundIndex + 1}
              </span>
              <div className="flex gap-2">
                {round.map((record, ti) => (
                  <ThrowBadge key={roundIndex * 3 + ti} record={record} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
