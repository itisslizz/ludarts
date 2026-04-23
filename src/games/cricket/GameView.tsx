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
  onUndo: (handler: () => void, canUndo: boolean) => void;
  onQuit: () => void;
  onPlayAgain: () => void;
}

function MarksDisplay({ count }: { count: number }) {
  if (count === 0)
    return <span className="text-xl text-zinc-300 dark:text-zinc-700">—</span>;
  if (count === 1)
    return <span className="text-2xl font-bold text-zinc-500">/</span>;
  if (count === 2)
    return <span className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">✕</span>;
  return (
    <span className="text-2xl font-bold text-green-600 dark:text-green-400">●</span>
  );
}

function ThrowBadge({ record }: { record: CricketThrowRecord }) {
  const hasEffect = record.marksAdded > 0 || record.pointsScored > 0;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-lg font-medium ${
        hasEffect
          ? "bg-green-500/15 text-green-700 dark:text-green-400"
          : "bg-zinc-200/50 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
      }`}
    >
      {record.segment.name.toUpperCase()}
      {record.pointsScored > 0 && (
        <span className="text-base text-green-500">+{record.pointsScored}</span>
      )}
    </span>
  );
}

export function CricketGameView({
  variant,
  playerIds,
  onThrowDetected,
  onTakeout,
  onUndo,
  onQuit,
  onPlayAgain,
}: CricketGameViewProps) {
  const { state, registerThrow, endTurn, undo, reset } = useCricketGameLogic(
    variant,
    playerIds,
  );
  const { players: allPlayers } = usePlayerStore();

  const canUndo = state.throwCount > 0 && state.currentVisit.length > 0;

  onThrowDetected(registerThrow);
  onTakeout(endTurn);
  onUndo(undo, canUndo);

  const playerName = (id: string) =>
    allPlayers.find((p) => p.id === id)?.name ?? "Unknown";

  if (state.phase === "complete") {
    return (
      <div className="flex flex-1 flex-col items-center gap-12 py-12">
        <div className="text-center">
          <h1 className="text-6xl font-bold">
            {state.winnerId
              ? `${playerName(state.winnerId)} wins!`
              : "Game Complete!"}
          </h1>
          <p className="mt-4 text-2xl text-zinc-500 dark:text-zinc-400">
            {variant === "hammer" ? "Hammer Cricket" : "Cricket"}
          </p>
        </div>

        {/* Final scoreboard */}
        <Scoreboard state={state} playerName={playerName} />

        <div className="flex gap-6">
          <button
            onClick={onQuit}
            className="rounded-2xl border-2 border-zinc-300 px-10 py-5 text-xl font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Home
          </button>
          <button
            onClick={() => {
              reset();
              onPlayAgain();
            }}
            className="rounded-2xl bg-green-600 px-12 py-5 text-2xl font-semibold text-white transition-colors hover:bg-green-500 active:bg-green-700"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = state.players[state.currentPlayerIndex];

  return (
    <div className="flex flex-1 flex-col items-center gap-8 py-8">

      {/* Scoreboard */}
      <Scoreboard
        state={state}
        playerName={playerName}
        currentPlayerIndex={state.currentPlayerIndex}
      />

      {/* Current turn */}
      <p className="text-xl text-zinc-500 dark:text-zinc-400">
        {playerName(currentPlayer.playerId)}&apos;s turn
      </p>

      {/* Current visit - Large display */}
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-3 gap-4">
          {state.currentVisit.map((record, i) => {
            const hasEffect = record.marksAdded > 0 || record.pointsScored > 0;
            return (
              <div
                key={i}
                className={`flex flex-col items-center justify-center rounded-2xl border-3 px-8 py-10 min-h-[180px] ${
                  hasEffect
                    ? "bg-green-500/15 border-green-500 text-green-700 dark:text-green-400"
                    : "bg-zinc-100 border-zinc-300 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-500"
                }`}
              >
                <span className="text-5xl font-bold">
                  {record.segment.name.toUpperCase()}
                </span>
                <span className="text-3xl font-semibold text-green-600 dark:text-green-400 mt-3 min-h-[40px]">
                  {record.pointsScored > 0 && `+${record.pointsScored}`}
                </span>
              </div>
            );
          })}
          {Array.from({ length: 3 - state.currentVisit.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 px-8 py-10 text-3xl text-zinc-400 dark:border-zinc-700 min-h-[180px]"
            >
              <span className="text-5xl">—</span>
              <span className="text-3xl mt-3 min-h-[40px]"></span>
            </div>
          ))}
        </div>
      </div>

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
    <div className="w-full max-w-6xl overflow-x-auto">
      <table className="w-full text-center text-lg">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-lg font-medium text-zinc-500 dark:text-zinc-400">
              Target
            </th>
            {state.players.map((p, i) => (
              <th
                key={p.playerId}
                className={`px-4 py-3 text-lg font-medium ${
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
            <tr key={target} className="border-t-2 border-zinc-200 dark:border-zinc-800">
              <td className="px-4 py-3 text-left text-xl font-semibold">
                {target === 25 ? "Bull" : target}
              </td>
              {state.players.map((p) => (
                <td key={p.playerId} className="px-4 py-3">
                  <MarksDisplay count={p.marks[target] ?? 0} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-zinc-300 dark:border-zinc-700">
            <td className="px-4 py-4 text-left text-lg font-medium text-zinc-500 dark:text-zinc-400">
              Score
            </td>
            {state.players.map((p) => (
              <td
                key={p.playerId}
                className="px-4 py-4 text-2xl font-bold tabular-nums"
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
