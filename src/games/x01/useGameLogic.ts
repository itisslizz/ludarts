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
  | { type: "REGISTER_THROW"; segment: Segment }
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

      // If already busted this visit, remaining throws are void
      if (state.busted) {
        const record: X01ThrowRecord = {
          segment: action.segment,
          points: 0,
          busted: true,
        };
        const visit = [...state.currentVisit, record];
        const isVisitEnd = visit.length >= 3;

        if (isVisitEnd) {
          return advancePlayer(
            { ...state, throwCount: state.throwCount + 1, currentVisit: visit },
            visit,
          );
        }

        return {
          ...state,
          throwCount: state.throwCount + 1,
          currentVisit: visit,
        };
      }

      const points = action.segment.number * action.segment.multiplier;
      const newScore = cp.score - points;
      const busted = isBust(newScore, state.outMode, action.segment);

      const record: X01ThrowRecord = {
        segment: action.segment,
        points: busted ? 0 : points,
        busted,
      };

      const visit = [...state.currentVisit, record];

      // Busted
      if (busted) {
        const isVisitEnd = visit.length >= 3;
        const nextState = {
          ...state,
          throwCount: state.throwCount + 1,
          currentVisit: visit,
          busted: true,
        };

        if (isVisitEnd) {
          return advancePlayer(nextState, visit);
        }
        return nextState;
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
    (segment: Segment) => dispatch({ type: "REGISTER_THROW", segment }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, registerThrow, reset };
}
