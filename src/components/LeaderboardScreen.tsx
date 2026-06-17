"use client";

import { useState, useEffect } from "react";
import type { LeaderboardEntry } from "@/lib/stats-store";

interface LeaderboardScreenProps {
  onBack: () => void;
}

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400/20 text-base font-bold text-yellow-600 dark:text-yellow-400">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-300/40 text-base font-bold text-zinc-500 dark:bg-zinc-600/40 dark:text-zinc-300">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-400/20 text-base font-bold text-orange-600 dark:text-orange-400">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center text-base font-medium text-zinc-400 dark:text-zinc-500">
      {rank}
    </span>
  );
}

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/leaderboard")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setEntries(data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b-2 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 purple:border-purple-900 purple:bg-purple-950">
        <button
          onClick={onBack}
          className="rounded-xl border-2 border-zinc-300 px-8 py-3 text-lg font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 purple:border-purple-700 purple:hover:bg-purple-900"
        >
          Back
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-bold">Leaderboard</h1>
        </div>

        {/* Spacer for symmetry */}
        <div className="w-[100px]"></div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {loading ? (
          <p className="py-12 text-center text-lg text-zinc-400 dark:text-zinc-500 purple:text-purple-400">
            Loading...
          </p>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-2xl font-semibold text-zinc-500 dark:text-zinc-400 purple:text-purple-400">
              No players qualify yet
            </p>
            <p className="max-w-sm text-base text-zinc-400 dark:text-zinc-500 purple:text-purple-500">
              Players need at least 50 legs played to appear on the leaderboard.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block w-full max-w-6xl mx-auto">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-sm text-zinc-500 dark:text-zinc-400 purple:text-purple-400">
                    <th className="px-3 py-2 text-center font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Player</th>
                    <th className="px-3 py-2 text-center font-medium">Elo</th>
                    <th className="px-3 py-2 text-center font-medium">Legs</th>
                    <th className="px-3 py-2 text-center font-medium">Won</th>
                    <th className="px-3 py-2 text-center font-medium">Lost</th>
                    <th className="px-3 py-2 text-center font-medium">Best Checkout</th>
                    <th className="px-3 py-2 text-center font-medium">100+ Checkouts</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr
                      key={entry.playerId}
                      className="rounded-xl border-2 border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 purple:border-purple-700 purple:bg-purple-950"
                    >
                      <td className="rounded-l-xl px-3 py-4 text-center">
                        <RankDisplay rank={index + 1} />
                      </td>
                      <td className="px-3 py-4 text-left">
                        <span className="text-lg font-semibold">{entry.name}</span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="rounded-lg bg-blue-500/15 px-3 py-1 text-sm font-bold text-blue-600 dark:text-blue-400">
                          {entry.eloRating}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center text-base font-medium text-zinc-700 dark:text-zinc-200 purple:text-purple-200">
                        {entry.legsPlayed}
                      </td>
                      <td className="px-3 py-4 text-center text-base font-semibold text-green-600 dark:text-green-400">
                        {entry.legsWon}
                      </td>
                      <td className="px-3 py-4 text-center text-base font-semibold text-red-600 dark:text-red-400">
                        {entry.legsLost}
                      </td>
                      <td className="px-3 py-4 text-center text-base font-medium text-zinc-700 dark:text-zinc-200 purple:text-purple-200">
                        {entry.highestCheckout != null ? entry.highestCheckout : "—"}
                      </td>
                      <td className="rounded-r-xl px-3 py-4 text-center text-base font-medium text-zinc-700 dark:text-zinc-200 purple:text-purple-200">
                        {entry.checkouts100Plus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {entries.map((entry, index) => (
                <div
                  key={entry.playerId}
                  className="rounded-xl border-2 border-zinc-200 bg-white px-5 py-4 dark:border-zinc-700 dark:bg-zinc-900 purple:border-purple-700 purple:bg-purple-950"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <RankDisplay rank={index + 1} />
                    <span className="text-xl font-semibold flex-1">{entry.name}</span>
                    <span className="rounded-lg bg-blue-500/15 px-3 py-1 text-sm font-bold text-blue-600 dark:text-blue-400">
                      {entry.eloRating}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-zinc-500 dark:text-zinc-400 purple:text-purple-400">Legs</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200 purple:text-purple-200">
                        {entry.legsPlayed}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-zinc-500 dark:text-zinc-400 purple:text-purple-400">Won</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {entry.legsWon}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-zinc-500 dark:text-zinc-400 purple:text-purple-400">Lost</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {entry.legsLost}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-zinc-500 dark:text-zinc-400 purple:text-purple-400">Best CO</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200 purple:text-purple-200">
                        {entry.highestCheckout != null ? entry.highestCheckout : "—"}
                      </span>
                    </div>
                    <div className="col-span-2 flex flex-col items-center gap-1">
                      <span className="text-zinc-500 dark:text-zinc-400 purple:text-purple-400">100+ Checkouts</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200 purple:text-purple-200">
                        {entry.checkouts100Plus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
