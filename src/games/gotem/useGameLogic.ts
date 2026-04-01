"use client";

import { useReducer, useCallback } from "react";
import type {
  GotemState,
  GotemThrowRecord,
  Segment,
} from "@/lib/types";

const TARGETS = [
  20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 25,
];

interface InitArgs {
  playerIds: string[];
}

type Action =
  | { type: "REGISTER_THROW"; segment: Segment }
  | { type: "END_TURN" }
  | { type: "UNDO" }
  | { type: "RESET" };

function createInitialState({ playerIds }: InitArgs): GotemState {
  const emptyMarks: Record<number, number> = {};
  const ownership: Record<number, string | null> = {};
  for (const t of TARGETS) {
    emptyMarks[t] = 0;
    ownership[t] = null;
  }

  return {
    phase: "playing",
    targets: TARGETS,
    ownership,
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

function advancePlayer(state: GotemState): GotemState {
  const nextPlayerIndex =
    (state.currentPlayerIndex + 1) % state.playerIds.length;

  const nextState: GotemState = {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    currentVisit: [],
  };

  // Check if all numbers are claimed
  const allClaimed = state.targets.every((t) => state.ownership[t] !== null);
  if (allClaimed) {
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    return { ...nextState, phase: "complete", winnerId: sorted[0].playerId };
  }

  return nextState;
}

function reducer(state: GotemState, action: Action): GotemState {
  switch (action.type) {
    case "REGISTER_THROW": {
      if (state.phase !== "playing") return state;

      const cp = state.players[state.currentPlayerIndex];
      const seg = action.segment;
      const target = state.targets.includes(seg.number) ? seg.number : null;

      let marksAdded = 0;
      let pointsScored = 0;
      let claimed = false;

      if (target !== null) {
        const owner = state.ownership[target];

        if (owner === cp.playerId) {
          // Already own it — score points
          pointsScored = seg.multiplier * target;
        } else if (owner === null) {
          // Unclaimed — add marks
          const currentMarks = cp.marks[target] ?? 0;
          const rawMarks = seg.multiplier;
          const newTotal = currentMarks + rawMarks;
          marksAdded = rawMarks;

          if (newTotal >= 3) {
            claimed = true;
            // Excess marks beyond 3 score points
            const excess = newTotal - 3;
            if (excess > 0) {
              pointsScored = excess * target;
            }
          }
        }
        // If owned by someone else, throw is wasted (no marks, no points)
      }

      const record: GotemThrowRecord = {
        segment: seg,
        target,
        marksAdded,
        pointsScored,
        claimed,
      };

      const visit = [...state.currentVisit, record];

      // Update state
      const newOwnership = { ...state.ownership };
      if (claimed && target !== null) {
        newOwnership[target] = cp.playerId;
      }

      const updatedPlayers = state.players.map((p, i) => {
        if (i !== state.currentPlayerIndex) return p;
        const newMarks = { ...p.marks };
        if (target !== null && marksAdded > 0) {
          newMarks[target] = (newMarks[target] ?? 0) + marksAdded;
        }
        return { ...p, marks: newMarks, score: p.score + pointsScored };
      });

      const nextState: GotemState = {
        ...state,
        ownership: newOwnership,
        players: updatedPlayers,
        throwCount: state.throwCount + 1,
        currentVisit: visit,
      };

      // Check if all claimed
      const allClaimed = state.targets.every((t) => nextState.ownership[t] !== null);
      if (allClaimed) {
        const sorted = [...nextState.players].sort((a, b) => b.score - a.score);
        return {
          ...nextState,
          phase: "complete",
          currentVisit: [],
          winnerId: sorted[0].playerId,
        };
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

        const newOwnership = { ...state.ownership };
        if (lastThrow.claimed && lastThrow.target !== null) {
          newOwnership[lastThrow.target] = null;
        }

        const updatedPlayers = state.players.map((p, i) => {
          if (i !== state.currentPlayerIndex) return p;
          const newMarks = { ...p.marks };
          if (lastThrow.target !== null && lastThrow.marksAdded > 0) {
            newMarks[lastThrow.target] = (newMarks[lastThrow.target] ?? 0) - lastThrow.marksAdded;
          }
          return { ...p, marks: newMarks, score: p.score - lastThrow.pointsScored };
        });

        return {
          ...state,
          phase: "playing",
          ownership: newOwnership,
          players: updatedPlayers,
          currentVisit: state.currentVisit.slice(0, -1),
          throwCount: state.throwCount - 1,
          winnerId: null,
        };
      }

      return state; // Cross-turn undo not supported
    }

    case "RESET":
      return createInitialState({ playerIds: state.playerIds });

    default:
      return state;
  }
}

export function useGotemGameLogic(playerIds: string[]) {
  const [state, dispatch] = useReducer(
    reducer,
    { playerIds },
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
