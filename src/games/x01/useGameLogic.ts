"use client";

import { useReducer, useCallback } from "react";
import type {
  X01State,
  X01Config,
  Segment,
  X01ThrowRecord,
} from "@/lib/types";

interface X01InitArgs {
  config: X01Config;
  playerIds: string[];
}

type Action =
  | { type: "REGISTER_THROW"; segment: Segment; coords?: { x: number; y: number } }
  | { type: "END_TURN" }
  | { type: "UNDO" }
  | { type: "RESET" };

function createInitialState({ config, playerIds }: X01InitArgs): X01State {
  return {
    phase: "playing",
    targetScore: config.baseScore,
    outMode: config.outMode,
    playerIds,
    players: playerIds.map((id) => ({
      playerId: id,
      score: config.baseScore,
      scoreAtVisitStart: config.baseScore,
      visits: [],
    })),
    currentPlayerIndex: 0,
    currentVisit: [],
    throwCount: 0,
    busted: false,
    winnerId: null,
  };
}

function isBust(
  newScore: number,
  outMode: "double" | "straight",
  segment: Segment,
): boolean {
  if (newScore < 0) return true;
  if (outMode === "double") {
    if (newScore === 1) return true;
    if (newScore === 0 && segment.multiplier !== 2) return true;
  }
  return false;
}

function advancePlayer(state: X01State, visit: X01ThrowRecord[]): X01State {
  const cp = state.players[state.currentPlayerIndex];
  const updatedPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex
      ? { ...p, visits: [...p.visits, visit], scoreAtVisitStart: p.score }
      : p,
  );

  // If busted, revert score
  if (state.busted || visit.some((t) => t.busted)) {
    updatedPlayers[state.currentPlayerIndex] = {
      ...updatedPlayers[state.currentPlayerIndex],
      score: cp.scoreAtVisitStart,
      scoreAtVisitStart: cp.scoreAtVisitStart,
    };
  }

  const nextPlayerIndex =
    (state.currentPlayerIndex + 1) % state.playerIds.length;

  return {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: nextPlayerIndex,
    currentVisit: [],
    busted: false,
  };
}

function reducer(state: X01State, action: Action): X01State {
  switch (action.type) {
    case "REGISTER_THROW": {
      if (state.phase !== "playing") return state;

      const cp = state.players[state.currentPlayerIndex];

      const points = action.segment.number * action.segment.multiplier;
      const newScore = cp.score - points;
      const busted = isBust(newScore, state.outMode, action.segment);

      const record: X01ThrowRecord = {
        segment: action.segment,
        points: busted ? 0 : points,
        busted,
        coords: action.coords,
      };

      const visit = [...state.currentVisit, record];

      // Busted — turn ends immediately
      if (busted) {
        const nextState = {
          ...state,
          throwCount: state.throwCount + 1,
          currentVisit: visit,
          busted: true,
        };

        return advancePlayer(nextState, visit);
      }

      // Checked out — winner!
      if (newScore === 0) {
        const updatedPlayers = state.players.map((p, i) =>
          i === state.currentPlayerIndex ? { ...p, score: 0, visits: [...p.visits, visit] } : p,
        );
        return {
          ...state,
          phase: "complete",
          players: updatedPlayers,
          throwCount: state.throwCount + 1,
          currentVisit: [],
          busted: false,
          winnerId: cp.playerId,
        };
      }

      // Valid throw, update player score
      const updatedPlayers = state.players.map((p, i) =>
        i === state.currentPlayerIndex ? { ...p, score: newScore } : p,
      );

      const isVisitEnd = visit.length >= 3;
      const nextState = {
        ...state,
        players: updatedPlayers,
        throwCount: state.throwCount + 1,
        currentVisit: visit,
        busted: false,
      };

      if (isVisitEnd) {
        // Lock in scoreAtVisitStart for the current player before advancing
        nextState.players = nextState.players.map((p, i) =>
          i === state.currentPlayerIndex
            ? { ...p, scoreAtVisitStart: newScore }
            : p,
        );
        return advancePlayer(nextState, visit);
      }

      return nextState;
    }

    case "END_TURN": {
      if (state.phase !== "playing") return state;
      if (state.currentVisit.length === 0) return state;

      const visit = state.currentVisit;
      const nextState = {
        ...state,
        players: state.players.map((p, i) =>
          i === state.currentPlayerIndex
            ? { ...p, scoreAtVisitStart: p.score }
            : p,
        ),
      };
      return advancePlayer(nextState, visit);
    }

    case "UNDO": {
      if (state.throwCount === 0) return state;

      // If there are throws in the current visit, undo the last one
      if (state.currentVisit.length > 0) {
        const lastThrow = state.currentVisit[state.currentVisit.length - 1];
        const cp = state.players[state.currentPlayerIndex];

        // Restore the player's score (add back the points if it wasn't busted)
        const restoredScore = lastThrow.busted ? cp.score : cp.score + lastThrow.points;

        // Check if we're un-busting: if the remaining visit has no busted throws
        const remainingVisit = state.currentVisit.slice(0, -1);
        const stillBusted = remainingVisit.some((t) => t.busted);

        return {
          ...state,
          phase: "playing",
          players: state.players.map((p, i) =>
            i === state.currentPlayerIndex ? { ...p, score: restoredScore } : p,
          ),
          currentVisit: remainingVisit,
          throwCount: state.throwCount - 1,
          busted: stillBusted,
          winnerId: null,
        };
      }

      // Current visit is empty — go back to previous player's last visit
      const prevPlayerIndex =
        (state.currentPlayerIndex - 1 + state.playerIds.length) %
        state.playerIds.length;
      const prevPlayer = state.players[prevPlayerIndex];

      if (prevPlayer.visits.length === 0) return state;

      const lastVisit = prevPlayer.visits[prevPlayer.visits.length - 1];
      const lastThrow = lastVisit[lastVisit.length - 1];
      const remainingVisit = lastVisit.slice(0, -1);

      // Recalculate score: the scoreAtVisitStart was set when the visit ended
      // We need to restore the score before the last throw
      const visitWasBusted = lastVisit.some((t) => t.busted);
      const restoredScore = visitWasBusted
        ? prevPlayer.scoreAtVisitStart
        : prevPlayer.score + lastThrow.points;

      const stillBusted = remainingVisit.some((t) => t.busted);

      // Restore the previous player's score to before that visit started
      // and put the remaining throws back as their current visit
      const prevScoreAtVisitStart = visitWasBusted
        ? prevPlayer.scoreAtVisitStart
        : prevPlayer.scoreAtVisitStart;

      return {
        ...state,
        phase: "playing",
        currentPlayerIndex: prevPlayerIndex,
        players: state.players.map((p, i) =>
          i === prevPlayerIndex
            ? {
                ...p,
                score: restoredScore,
                scoreAtVisitStart: prevScoreAtVisitStart,
                visits: p.visits.slice(0, -1),
              }
            : p,
        ),
        currentVisit: remainingVisit,
        throwCount: state.throwCount - 1,
        busted: stillBusted,
        winnerId: null,
      };
    }

    case "RESET":
      return createInitialState({
        config: {
          baseScore: state.targetScore as 301 | 501 | 701,
          outMode: state.outMode,
        },
        playerIds: state.playerIds,
      });

    default:
      return state;
  }
}

export function useX01GameLogic(config: X01Config, playerIds: string[]) {
  const [state, dispatch] = useReducer(reducer, { config, playerIds }, createInitialState);

  const registerThrow = useCallback(
    (segment: Segment, coords?: { x: number; y: number }) =>
      dispatch({ type: "REGISTER_THROW", segment, coords }),
    [],
  );
  const endTurn = useCallback(() => dispatch({ type: "END_TURN" }), []);
  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, registerThrow, endTurn, undo, reset };
}
