"use client";

import { useRef, useEffect, useState } from "react";
import { useX01GameLogic } from "./useGameLogic";
import { computeStats } from "./stats";
import { saveX01Leg, type PlayerEloData } from "./saveGame";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { ScorePicker } from "@/components/ScorePicker";
import { getCheckoutSuggestion } from "@/lib/checkouts";
import { computeBadges, type Badge } from "@/lib/badges";
import type { Segment, X01Config, X01ThrowRecord } from "@/lib/types";

interface X01GameViewProps {
  config: X01Config;
  playerIds: string[];
  onThrowDetected: (handler: (segment: Segment, coords?: { x: number; y: number }) => void) => void;
  onTakeout: (handler: () => void) => void;
  onUndo: (handler: () => void, canUndo: boolean) => void;
  onQuit: () => void;
  onPlayAgain: () => void;
  onMount?: () => void;
}

async function fetchEarnedBadgesForPlayers(ids: string[]): Promise<Record<string, Badge[]>> {
  const result: Record<string, Badge[]> = {};
  await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(`/api/stats/players/${id}`);
        if (res.ok) {
          const { player, stats } = await res.json();
          result[id] = computeBadges(stats, player.elo_rating ?? 1500).filter((b) => b.earned);
        } else {
          result[id] = [];
        }
      } catch {
        result[id] = [];
      }
    }),
  );
  return result;
}

function ThrowBadge({ record }: { record: X01ThrowRecord }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-lg font-medium ${
        record.busted
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "bg-zinc-200/50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {record.segment.name.toUpperCase()}
      {!record.busted && (
        <span className="text-base text-zinc-400">({record.points})</span>
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
    <div className="flex w-full flex-col gap-2">
      {[...visits].reverse().map((visit, ri) => {
        const visitIndex = visits.length - 1 - ri;
        const busted = visit.some((t) => t.busted);
        const visitTotal = busted ? 0 : visit.reduce((s, t) => s + t.points, 0);

        return (
          <div
            key={visitIndex}
            className="flex items-center gap-4 rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-900 purple:bg-purple-950"
          >
            {playerName && (
              <span className="w-20 truncate text-base font-medium text-zinc-400 dark:text-zinc-500 purple:text-purple-400">
                {playerName}
              </span>
            )}
            <div className="flex flex-1 gap-2">
              {visit.map((record, ti) => (
                <ThrowBadge key={visitIndex * 3 + ti} record={record} />
              ))}
            </div>
            <span
              className={`text-lg font-semibold ${
                busted
                  ? "text-red-500"
                  : "text-zinc-600 dark:text-zinc-400 purple:text-purple-200"
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
  onUndo,
  onQuit,
  onPlayAgain,
  onMount,
}: X01GameViewProps) {
  const { state, registerThrow, endTurn, undo, reset, continueToNextLeg } = useX01GameLogic(config, playerIds);
  const { players: allPlayers } = usePlayerStore();
  const mountedRef = useRef(false);
  const savedLegsRef = useRef(0);
  const [playerEloData, setPlayerEloData] = useState<PlayerEloData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const initialBadgeIdsRef = useRef<Record<string, Set<string>> | null>(null);
  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<Array<{ badge: Badge; playerName: string }>>([]);

  // Can undo if there are throws in current visit OR any player has completed visits
  const canUndo = state.currentVisit.length > 0 || state.players.some(p => p.visits.length > 0);

  onThrowDetected(registerThrow);
  onTakeout(endTurn);
  onUndo(undo, canUndo);

  // Reset board on mount and capture baseline badge state
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      onMount?.();
      fetchEarnedBadgesForPlayers(playerIds).then((byPlayer) => {
        const sets: Record<string, Set<string>> = {};
        for (const id of playerIds) {
          sets[id] = new Set((byPlayer[id] ?? []).map((b) => b.id));
        }
        initialBadgeIdsRef.current = sets;
      });
    }
  }, [onMount]); // playerIds won't change during a game

  // Save each completed leg
  useEffect(() => {
    // Reset savedLegsRef when game is reset (completedLegs becomes empty)
    if (state.completedLegs.length === 0 && savedLegsRef.current > 0) {
      savedLegsRef.current = 0;
      setPlayerEloData([]);
      return;
    }
    
    const newLegs = state.completedLegs.slice(savedLegsRef.current);
    if (newLegs.length > 0) {
      setIsSaving(true);
      // Save each new leg and get Elo updates
      (async () => {
        for (const legData of newLegs) {
          try {
            const eloData = await saveX01Leg(legData, state, config.eloEnabled ?? false);
            setPlayerEloData(eloData);
          } catch (error) {
            console.error('Failed to save leg:', error);
          }
        }
        savedLegsRef.current = state.completedLegs.length;

        // Diff badge state to surface newly earned achievements
        if (initialBadgeIdsRef.current) {
          const byPlayer = await fetchEarnedBadgesForPlayers(playerIds);
          const newlyEarned: Array<{ badge: Badge; playerName: string }> = [];
          for (const id of playerIds) {
            const initialIds = initialBadgeIdsRef.current[id] ?? new Set<string>();
            for (const badge of byPlayer[id] ?? []) {
              if (!initialIds.has(badge.id)) {
                newlyEarned.push({ badge, playerName: allPlayers.find((p) => p.id === id)?.name ?? "Unknown" });
              }
            }
            initialBadgeIdsRef.current[id] = new Set((byPlayer[id] ?? []).map((b) => b.id));
          }
          if (newlyEarned.length > 0) setNewlyEarnedBadges(newlyEarned);
        }

        setIsSaving(false);
      })();
    }
  }, [state.completedLegs.length, state]);

  const playerName = (id: string) =>
    allPlayers.find((p) => p.id === id)?.name ?? "Unknown";

  // Leg complete screen (for multi-leg matches)
  if (state.phase === "legComplete") {
    const completedLeg = state.completedLegs[state.completedLegs.length - 1];
    const legWinner = state.players.find(p => p.playerId === completedLeg.winnerId);
    
    // Get stats for the completed leg
    const legPlayerData = completedLeg.players.map(lp => {
      const currentPlayerState = state.players.find(p => p.playerId === lp.playerId);
      const stats = computeStats({ ...currentPlayerState!, visits: lp.visits }, state.targetScore);
      return {
        playerId: lp.playerId,
        name: playerName(lp.playerId),
        isWinner: lp.playerId === completedLeg.winnerId,
        legsWon: currentPlayerState?.legsWon ?? 0,
        stats,
      };
    });

    return (
      <div className="flex flex-1 flex-col items-center gap-12 py-12">
        <div className="text-center">
          <h1 className="text-6xl font-bold">
            Leg {completedLeg.legNumber} Complete!
          </h1>
          <p className="mt-4 text-3xl font-semibold text-green-600 dark:text-green-400">
            {playerName(completedLeg.winnerId)} wins the leg!
          </p>
          <p className="mt-2 text-xl text-zinc-500 dark:text-zinc-400">
            {state.targetScore} &middot; {state.outMode === "double" ? "Double Out" : "Straight Out"}
          </p>
        </div>

        {/* Current match score */}
        <div className="flex gap-8 items-center">
          {legPlayerData.map(({ playerId, name, legsWon }) => (
            <div key={playerId} className="text-center">
              <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">{name}</p>
              <p className="text-5xl font-bold tabular-nums">{legsWon}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">legs</p>
            </div>
          ))}
        </div>

        {/* Leg stats cards */}
        <div className={`grid w-full max-w-6xl gap-6 ${
          legPlayerData.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
        }`}>
          {legPlayerData.map(({ playerId, name, isWinner, stats }) => {
            const eloInfo = playerEloData.find(p => p.playerId === playerId);
            
            return (
            <div
              key={playerId}
              className={`rounded-2xl px-8 py-7 ${
                isWinner
                  ? "bg-green-500/10 border-2 border-green-500"
                  : "bg-zinc-100 dark:bg-zinc-900 purple:bg-purple-950"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-bold">{name}</span>
                  {eloInfo && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {eloInfo.eloChange !== null && eloInfo.eloChange !== 0 && (
                        <>
                          <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">
                            {eloInfo.eloRating - eloInfo.eloChange}
                          </span>
                          <span className="text-base text-zinc-400 dark:text-zinc-500">→</span>
                        </>
                      )}
                      <span className="rounded-lg bg-blue-500/15 px-3 py-1 text-base font-bold text-blue-600 dark:text-blue-400">
                        {eloInfo.eloRating}
                      </span>
                      {eloInfo.eloChange !== null && eloInfo.eloChange !== 0 && (
                        <span className={`text-base font-semibold ${
                          eloInfo.eloChange > 0 
                            ? "text-green-600 dark:text-green-400" 
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          ({eloInfo.eloChange > 0 ? "+" : ""}{eloInfo.eloChange})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {isWinner && (
                  <span className="rounded-full bg-green-500 px-4 py-1 text-base font-semibold text-white">
                    Leg Winner
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-y-6 gap-x-8 text-center">
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.ppr.toFixed(1)}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">PPR</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.first9Ppr.toFixed(1)}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">First 9 PPR</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.checkoutRate}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">Checkout</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.visits60}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">60+</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.visits100}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">100+</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.visits140}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">140+</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.visits180}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">180s</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.washmachineCount}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">26</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.totalDarts}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">Darts</p>
                </div>
              </div>
            </div>
          );
          })}
        </div>

        {newlyEarnedBadges.length > 0 && (
          <div className="flex flex-col gap-3 w-full max-w-2xl">
            {newlyEarnedBadges.map(({ badge, playerName: name }) => (
              <div key={badge.id} className="flex items-center gap-4 rounded-2xl border-2 border-yellow-400 bg-yellow-400/10 px-6 py-4">
                <span className="text-3xl">{badge.icon}</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-yellow-600 dark:text-yellow-400">Achievement Unlocked!</p>
                  <p className="text-lg font-bold">{name} — {badge.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={async () => {
            // Wait for any pending save to complete
            while (isSaving) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            setNewlyEarnedBadges([]);
            continueToNextLeg();
          }}
          disabled={isSaving}
          className="rounded-2xl bg-green-600 px-6 py-6 text-2xl font-semibold text-white transition-colors hover:bg-green-500 active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Next Leg"}
        </button>
      </div>
    );
  }

  if (state.phase === "complete") {
    const playerStats = state.players.map((ps) => ({
      ...ps,
      stats: computeStats(ps, state.targetScore),
      name: playerName(ps.playerId),
      isWinner: ps.playerId === state.winnerId,
    }));

    return (
      <div className="flex flex-1 flex-col items-center gap-12 py-12">
        <div className="text-center">
          <h1 className="text-6xl font-bold">
            {state.winnerId ? `${playerName(state.winnerId)} wins!` : "Game Complete!"}
          </h1>
          <p className="mt-4 text-2xl text-zinc-500 dark:text-zinc-400">
            {state.targetScore} &middot; {state.outMode === "double" ? "Double Out" : "Straight Out"}
          </p>
        </div>

        {/* Player stats cards */}
        <div className={`grid w-full max-w-6xl gap-6 ${
          playerStats.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
        }`}>
          {playerStats.map(({ playerId, name, isWinner, stats }) => {
            const eloInfo = playerEloData.find(p => p.playerId === playerId);
            
            return (
            <div
              key={playerId}
              className={`rounded-2xl px-8 py-7 ${
                isWinner
                  ? "bg-green-500/10 border-2 border-green-500"
                  : "bg-zinc-100 dark:bg-zinc-900 purple:bg-purple-950"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-bold">{name}</span>
                  {eloInfo && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {eloInfo.eloChange !== null && eloInfo.eloChange !== 0 && (
                        <>
                          <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">
                            {eloInfo.eloRating - eloInfo.eloChange}
                          </span>
                          <span className="text-base text-zinc-400 dark:text-zinc-500">→</span>
                        </>
                      )}
                      <span className="rounded-lg bg-blue-500/15 px-3 py-1 text-base font-bold text-blue-600 dark:text-blue-400">
                        {eloInfo.eloRating}
                      </span>
                      {eloInfo.eloChange !== null && eloInfo.eloChange !== 0 && (
                        <span className={`text-base font-semibold ${
                          eloInfo.eloChange > 0 
                            ? "text-green-600 dark:text-green-400" 
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          ({eloInfo.eloChange > 0 ? "+" : ""}{eloInfo.eloChange})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {isWinner && (
                  <span className="rounded-full bg-green-500 px-4 py-1 text-base font-semibold text-white">
                    Winner
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-y-6 gap-x-8 text-center">
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.ppr.toFixed(1)}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">PPR</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.first9Ppr.toFixed(1)}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">First 9 PPR</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.checkoutRate}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">Checkout</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.visits60}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">60+</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.visits100}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">100+</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.visits140}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">140+</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.visits180}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">180s</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.washmachineCount}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">26</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{stats.totalDarts}</p>
                  <p className="text-base text-zinc-500 dark:text-zinc-400">Darts</p>
                </div>
              </div>
            </div>
          );
          })}
        </div>

        {newlyEarnedBadges.length > 0 && (
          <div className="flex flex-col gap-3 w-full max-w-2xl">
            {newlyEarnedBadges.map(({ badge, playerName: name }) => (
              <div key={badge.id} className="flex items-center gap-4 rounded-2xl border-2 border-yellow-400 bg-yellow-400/10 px-6 py-4">
                <span className="text-3xl">{badge.icon}</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-yellow-600 dark:text-yellow-400">Achievement Unlocked!</p>
                  <p className="text-lg font-bold">{name} — {badge.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating action buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          <button
            onClick={onQuit}
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-zinc-300 bg-white shadow-lg transition-all hover:scale-110 hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
            title="Home"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <button
            onClick={async () => {
              // Wait for any pending save to complete
              while (isSaving) {
                await new Promise(resolve => setTimeout(resolve, 50));
              }
              setNewlyEarnedBadges([]);
              reset();
              onPlayAgain();
            }}
            disabled={isSaving}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 shadow-lg transition-all hover:scale-110 hover:bg-green-500 hover:shadow-xl active:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Play Again"
          >
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Playing phase
  const currentPlayer = state.players[state.currentPlayerIndex];
  const visitHasBust = state.currentVisit.some((t) => t.busted);
  const visitTotal = visitHasBust ? 0 : state.currentVisit.reduce((s, t) => s + t.points, 0);
  const isMultiplayer = state.playerIds.length > 1;
  
  // Calculate checkout suggestion for current player
  let checkoutSuggestion = null;
  if (!visitHasBust) {
    // currentPlayer.score is already the remaining score (updated after each throw)
    const remainingScore = currentPlayer.score;
    const dartsRemaining = 3 - state.currentVisit.length;
    if (remainingScore > 1 && dartsRemaining > 0) {
      checkoutSuggestion = getCheckoutSuggestion(remainingScore, dartsRemaining, state.outMode);
    }
  }
  
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
    <div className="flex flex-1 flex-col items-center gap-8 px-6 py-8">
      {state.firstTo > 1 && (
        <p className="text-xl text-zinc-500 dark:text-zinc-400">
          Leg {state.currentLeg} • First to {state.firstTo}
        </p>
      )}

      {/* Scoreboard */}
      <div className={`grid w-full max-w-6xl gap-4 ${
        isMultiplayer ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
      }`}>
        {state.players.map((ps, i) => {
          // Calculate total darts: busted visits = 3, otherwise actual count
          let totalDarts = ps.visits.reduce((sum, v) => {
            const busted = v.some((t) => t.busted);
            return sum + (busted ? 3 : v.length);
          }, 0);
          
          // For current player, include current visit darts (not busted yet)
          const isCurrentPlayer = i === state.currentPlayerIndex;
          if (isCurrentPlayer && state.currentVisit.length > 0 && !visitHasBust) {
            totalDarts += state.currentVisit.length;
          }
          
          const totalPoints = state.targetScore - ps.score;
          const ppr = totalDarts > 0 ? ((totalPoints * 3) / totalDarts).toFixed(1) : "—";
          const lastVisit = ps.visits.length > 0 ? ps.visits[ps.visits.length - 1] : null;
          const lastVisitHasBust = lastVisit?.some((t) => t.busted) ?? false;
          const lastVisitScore = lastVisit
            ? (lastVisitHasBust ? 0 : lastVisit.reduce((sum, t) => sum + t.points, 0))
            : null;
          
          // Show visit total for current player (0 if busted)
          const showVisitTotal = isCurrentPlayer && visitTotal > 0;

          return (
            <div
              key={ps.playerId}
              className={`flex flex-col items-center rounded-2xl px-6 py-5 ${
                isCurrentPlayer
                  ? "bg-yellow-400/15 border-2 border-yellow-400"
                  : "bg-zinc-100 dark:bg-zinc-900 purple:bg-purple-950"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-zinc-500 dark:text-zinc-400 truncate text-center">
                  {playerName(ps.playerId)}
                </span>
                {state.firstTo > 1 && ps.legsWon > 0 && (
                  <span className="text-base font-semibold text-green-600 dark:text-green-500">
                    ({ps.legsWon})
                  </span>
                )}
              </div>
              
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold tabular-nums">{ps.score}</span>
                {showVisitTotal && (
                  <span className="text-3xl font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {visitTotal}
                  </span>
                )}
              </div>
              <div className="flex gap-4 mt-2 text-base text-zinc-400 dark:text-zinc-500 tabular-nums">
                <span>Last: {lastVisitScore !== null ? lastVisitScore : "—"}</span>
                <span>PPR: {ppr}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current visit - Large display */}
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-3 gap-4">
          {state.currentVisit.map((record, i) => (
            <div
              key={i}
              className={`flex items-center justify-center rounded-2xl border-3 px-8 py-8 min-h-[120px] ${
                record.busted
                  ? "bg-red-500/15 border-red-500 text-red-600 dark:text-red-400"
                  : "bg-zinc-100 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-400 dark:text-zinc-100"
              }`}
            >
              <span className="text-5xl font-bold">
                {record.segment.name.toUpperCase()}
              </span>
            </div>
          ))}
          {Array.from({ length: 3 - state.currentVisit.length }).map((_, i) => {
            // i represents the index in the remaining empty boxes (0, 1, or 2)
            // We want to show the i-th suggested dart from the checkout
            const suggestedDart = checkoutSuggestion?.darts[i];
            
            return (
              <div
                key={`empty-${i}`}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-8 min-h-[120px] ${
                  suggestedDart
                    ? "border-green-400/50 bg-green-500/5 dark:border-green-500/40 dark:bg-green-500/5"
                    : "border-zinc-300 dark:border-zinc-700"
                }`}
              >
                {suggestedDart ? (
                  <>
                    <span className="text-4xl font-bold italic text-green-600/60 dark:text-green-400/60">
                      {suggestedDart}
                    </span>
                    <span className="text-sm font-medium italic text-green-600/50 dark:text-green-400/50 mt-1">
                      suggested
                    </span>
                  </>
                ) : (
                  <span className="text-5xl text-zinc-400">—</span>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Bust message */}
        {state.busted && (
          <div className="flex justify-center mt-6">
            <span className="text-3xl font-bold text-red-500">BUST</span>
          </div>
        )}
      </div>

      {state.waitingForTakeout ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl font-semibold text-yellow-500 animate-pulse">
            Waiting for takeout...
          </p>
          <button
            onClick={endTurn}
            className="rounded-xl border-2 border-zinc-300 px-8 py-4 text-lg font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Next Player
          </button>
        </div>
      ) : (
        <>

          {/* Manual score entry */}
          <ScorePicker onSelect={registerThrow} />
        </>
      )}

      {/* Visit history */}
      <div className="w-full max-w-6xl overflow-y-auto max-h-64">
        {isMultiplayer ? (
          <div className="flex flex-col gap-2">
            {[...allVisits].reverse().map((entry, i) => {
              const busted = entry.visit.some((t) => t.busted);
              const visitTotal = busted ? 0 : entry.visit.reduce((s, t) => s + t.points, 0);
              return (
                <div
                  key={allVisits.length - 1 - i}
                  className="flex items-center gap-4 rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-900 purple:bg-purple-950"
                >
                  <span className="w-20 truncate text-base font-medium text-zinc-400 dark:text-zinc-500">
                    {playerName(entry.playerId)}
                  </span>
                  <div className="flex flex-1 gap-2">
                    {entry.visit.map((record, ti) => (
                      <ThrowBadge key={ti} record={record} />
                    ))}
                  </div>
                  <span
                    className={`text-lg font-semibold ${
                      busted ? "text-red-500" : "text-zinc-600 dark:text-zinc-400 purple:text-purple-200"
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
