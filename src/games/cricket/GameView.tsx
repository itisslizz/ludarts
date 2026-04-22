"use client";

import { useCricketGameLogic } from "./useGameLogic";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { ScorePicker } from "@/components/ScorePicker";
import type { Segment, CricketThrowRecord } from "@/lib/types";

interface CricketGameViewProps {
  variant: "cricket" | "hammer";
  playerIds: string[];
  onThrowDetected: (handler: (segment: Segment, coords?: { x: number; y: number }) => void) => void;
  onTakeout: (handler: () => void) => void;
  onQuit: () => void;
  onPlayAgain: () => void;
}

function MarksDisplay({ count }: { count: number }) {
  if (count === 0)
    return <span className="text-zinc-300 dark:text-zinc-700">—</span>;
  if (count === 1)
    return <span className="font-bold text-zinc-500">/</span>;
  if (count === 2)
    return <span className="font-bold text-zinc-600 dark:text-zinc-400">✕</span>;
  return (
    <span className="font-bold text-green-600 dark:text-green-400">●</span>
  );
}

function ThrowBadge({ record }: { record: CricketThrowRecord }) {
  const hasEffect = record.marksAdded > 0 || record.pointsScored > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm font-medium ${
        hasEffect
          ? "bg-green-500/15 text-green-700 dark:text-green-400"
          : "bg-zinc-200/50 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
      }`}
    >
      {record.segment.name.toUpperCase()}
      {record.pointsScored > 0 && (
        <span className="text-xs text-green-500">+{record.pointsScored}</span>
      )}
    </span>
  );
}

export function CricketGameView({
  variant,
  playerIds,
  onThrowDetected,
  onTakeout,
  onQuit,
  onPlayAgain,
}: CricketGameViewProps) {
  const { state, registerThrow, endTurn, undo, reset } = useCricketGameLogic(
    variant,
    playerIds,
  );
  const { players: allPlayers } = usePlayerStore();

  onThrowDetected(registerThrow);
  onTakeout(endTurn);

  const playerName = (id: string) =>
    allPlayers.find((p) => p.id === id)?.name ?? "Unknown";

  if (state.phase === "complete") {
    return (
      <div className="flex flex-1 flex-col items-center gap-8 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            {state.winnerId
              ? `${playerName(state.winnerId)} wins!`
              : "Game Complete!"}
          </h1>
          <p className="mt-2 text-lg text-zinc-500 dark:text-zinc-400">
            {variant === "hammer" ? "Hammer Cricket" : "Cricket"}
          </p>
        </div>

        {/* Final scoreboard */}
        <Scoreboard state={state} playerName={playerName} />

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

  const currentPlayer = state.players[state.currentPlayerIndex];

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-6">
      <div className="flex w-full max-w-5xl items-center justify-between">
        <button
          onClick={onQuit}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Quit
        </button>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {variant === "hammer" ? "Hammer Cricket" : "Cricket"}
        </p>
      </div>

      {/* Scoreboard */}
      <Scoreboard
        state={state}
        playerName={playerName}
        currentPlayerIndex={state.currentPlayerIndex}
      />

      {/* Current turn */}
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {playerName(currentPlayer.playerId)}&apos;s turn
      </p>

      {/* Current visit - Large display */}
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-3 gap-3">
          {state.currentVisit.map((record, i) => {
            const hasEffect = record.marksAdded > 0 || record.pointsScored > 0;
            return (
              <div
                key={i}
                className={`flex flex-col items-center justify-center rounded-xl border-2 px-6 py-8 min-h-[140px] ${
                  hasEffect
                    ? "bg-green-500/15 border-green-500 text-green-700 dark:text-green-400"
                    : "bg-zinc-100 border-zinc-300 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-500"
                }`}
              >
                <span className="text-4xl font-bold">
                  {record.segment.name.toUpperCase()}
                </span>
                <span className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-2 min-h-[32px]">
                  {record.pointsScored > 0 && `+${record.pointsScored}`}
                </span>
              </div>
            );
          })}
          {Array.from({ length: 3 - state.currentVisit.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 px-6 py-8 text-2xl text-zinc-400 dark:border-zinc-700 min-h-[140px]"
            >
              <span className="text-4xl">—</span>
              <span className="text-2xl mt-2 min-h-[32px]"></span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={undo}
        disabled={state.throwCount === 0 || state.currentVisit.length === 0}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Undo Last Throw
      </button>

      <ScorePicker onSelect={registerThrow} />
    </div>
  );
}

function Scoreboard({
  state,
  playerName,
  currentPlayerIndex,
}: {
  state: CricketGameViewProps extends never ? never : ReturnType<typeof useCricketGameLogic>["state"];
  playerName: (id: string) => string;
  currentPlayerIndex?: number;
}) {
  return (
    <div className="w-full max-w-5xl overflow-x-auto">
      <table className="w-full text-center text-sm">
        <thead>
          <tr>
            <th className="px-3 py-1 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Target
            </th>
            {state.players.map((p, i) => (
              <th
                key={p.playerId}
                className={`px-3 py-1 text-xs font-medium ${
                  i === currentPlayerIndex
                    ? "text-yellow-500"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {playerName(p.playerId)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {state.targets.map((target) => (
            <tr key={target} className="border-t border-zinc-200 dark:border-zinc-800">
              <td className="px-3 py-1.5 text-left font-semibold">
                {target === 25 ? "Bull" : target}
              </td>
              {state.players.map((p) => (
                <td key={p.playerId} className="px-3 py-1.5">
                  <MarksDisplay count={p.marks[target] ?? 0} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-zinc-300 dark:border-zinc-700">
            <td className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Score
            </td>
            {state.players.map((p) => (
              <td
                key={p.playerId}
                className="px-3 py-2 text-lg font-bold tabular-nums"
              >
                {p.score}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
