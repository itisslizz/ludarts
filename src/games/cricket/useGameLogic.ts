"use client";

import { useReducer, useCallback } from "react";
import type {
  CricketState,
  CricketThrowRecord,
  CricketPlayerState,
  Segment,
} from "@/lib/types";

const CRICKET_TARGETS = [20, 19, 18, 17, 16, 15, 25];
const HAMMER_TARGETS = [
  20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 25,
];

type Variant = "cricket" | "hammer";

interface InitArgs {
  variant: Variant;
  playerIds: string[];
}

type Action =
  | { type: "REGISTER_THROW"; segment: Segment }
  | { type: "END_TURN" }
  | { type: "UNDO" }
  | { type: "RESET" };

function createInitialState({ variant, playerIds }: InitArgs): CricketState {
  const targets = variant === "hammer" ? HAMMER_TARGETS : CRICKET_TARGETS;
  const emptyMarks: Record<number, number> = {};
  for (const t of targets) emptyMarks[t] = 0;

  return {
    phase: "playing",
    variant,
    targets,
    playerIds,
    players: playerIds.map((id) => ({
      playerId: id,
      marks: { ...emptyMarks },
      score: 0,
    })),
    currentPlayerIndex: 0,
    currentVisit: [],
    throwCount: 0,
    winnerId: null,
  };
}

function isTargetClosed(players: CricketPlayerState[], target: number): boolean {
  return players.every((p) => (p.marks[target] ?? 0) >= 3);
}

function checkWinner(state: CricketState): string | null {
  // A player wins if they've closed all targets and have the highest score
  for (const player of state.players) {
    const allClosed = state.targets.every((t) => (player.marks[t] ?? 0) >= 3);
    if (!allClosed) continue;

    const hasHighestScore = state.players.every(
      (other) => other.playerId === player.playerId || player.score >= other.score,
    );
    if (hasHighestScore) return player.playerId;
  }

  // Also check if all targets are closed by everyone
  const allClosedByEveryone = state.targets.every((t) =>
    isTargetClosed(state.players, t),
  );
  if (allClosedByEveryone) {
    // Highest score wins
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    return sorted[0].playerId;
  }

  return null;
}

function advancePlayer(state: CricketState): CricketState {
  const updatedPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex
      ? { ...p }
      : p,
  );
  const nextPlayerIndex =
    (state.currentPlayerIndex + 1) % state.playerIds.length;

  const nextState: CricketState = {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: nextPlayerIndex,
    currentVisit: [],
  };

  const winnerId = checkWinner(nextState);
  if (winnerId) {
    return { ...nextState, phase: "complete", winnerId };
  }

  return nextState;
}

function reducer(state: CricketState, action: Action): CricketState {
  switch (action.type) {
    case "REGISTER_THROW": {
      if (state.phase !== "playing") return state;

      const cp = state.players[state.currentPlayerIndex];
      const seg = action.segment;
      const target = state.targets.includes(seg.number) ? seg.number : null;

      let marksAdded = 0;
      let pointsScored = 0;

      if (target !== null && !isTargetClosed(state.players, target)) {
        const currentMarks = cp.marks[target] ?? 0;
        const rawMarks = seg.number === 25 ? seg.multiplier : seg.multiplier;
        const newTotal = currentMarks + rawMarks;

        if (currentMarks >= 3) {
          // Already open — all marks score
          pointsScored = rawMarks * target;
          marksAdded = rawMarks;
        } else if (newTotal > 3) {
          // Some marks to open, excess scores
          marksAdded = rawMarks;
          const excess = newTotal - 3;
          pointsScored = excess * target;
        } else {
          marksAdded = rawMarks;
        }
      }

      const record: CricketThrowRecord = {
        segment: seg,
        target,
        marksAdded,
        pointsScored,
      };

      const visit = [...state.currentVisit, record];

      // Update player marks and score
      const updatedPlayers = state.players.map((p, i) => {
        if (i !== state.currentPlayerIndex) return p;
        const newMarks = { ...p.marks };
        if (target !== null) {
          newMarks[target] = (newMarks[target] ?? 0) + marksAdded;
        }
        return { ...p, marks: newMarks, score: p.score + pointsScored };
      });

      const nextState: CricketState = {
        ...state,
        players: updatedPlayers,
        throwCount: state.throwCount + 1,
        currentVisit: visit,
      };

      // Check for win after this throw
      const winnerId = checkWinner(nextState);
      if (winnerId) {
        return { ...nextState, phase: "complete", currentVisit: [], winnerId };
      }

      if (visit.length >= 3) {
        return advancePlayer(nextState);
      }

      return nextState;
    }

    case "END_TURN": {
      if (state.phase !== "playing") return state;
      if (state.currentVisit.length === 0) return state;
      return advancePlayer(state);
    }

    case "UNDO": {
      if (state.throwCount === 0) return state;

      if (state.currentVisit.length > 0) {
        const lastThrow = state.currentVisit[state.currentVisit.length - 1];

        const updatedPlayers = state.players.map((p, i) => {
          if (i !== state.currentPlayerIndex) return p;
          const newMarks = { ...p.marks };
          if (lastThrow.target !== null) {
            newMarks[lastThrow.target] = (newMarks[lastThrow.target] ?? 0) - lastThrow.marksAdded;
          }
          return { ...p, marks: newMarks, score: p.score - lastThrow.pointsScored };
        });

        return {
          ...state,
          phase: "playing",
          players: updatedPlayers,
          currentVisit: state.currentVisit.slice(0, -1),
          throwCount: state.throwCount - 1,
          winnerId: null,
        };
      }

      // Cross-turn undo not supported for cricket
      return state; // Cross-turn undo not supported for cricket
    }

    case "RESET":
      return createInitialState({
        variant: state.variant,
        playerIds: state.playerIds,
      });

    default:
      return state;
  }
}

export function useCricketGameLogic(variant: Variant, playerIds: string[]) {
  const [state, dispatch] = useReducer(
    reducer,
    { variant, playerIds },
    createInitialState,
  );

  const registerThrow = useCallback(
    (segment: Segment) => dispatch({ type: "REGISTER_THROW", segment }),
    [],
  );
  const endTurn = useCallback(() => dispatch({ type: "END_TURN" }), []);
  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, registerThrow, endTurn, undo, reset };
}
