"use client";

import { useReducer, useCallback } from "react";
import type { X01State, X01Config, Segment, X01ThrowRecord } from "@/lib/types";

type Action =
  | { type: "REGISTER_THROW"; segment: Segment }
  | { type: "RESET" };

function createInitialState(config: X01Config): X01State {
  return {
    phase: "playing",
    targetScore: config.baseScore,
    outMode: config.outMode,
    score: config.baseScore,
    scoreAtVisitStart: config.baseScore,
    currentVisit: [],
    throwCount: 0,
    visits: [],
    busted: false,
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

function reducer(state: X01State, action: Action): X01State {
  switch (action.type) {
    case "REGISTER_THROW": {
      if (state.phase !== "playing") return state;
      // If already busted this visit, ignore remaining throws
      if (state.busted) {
        // Wait for visit to end (3 throws)
        const record: X01ThrowRecord = {
          segment: action.segment,
          points: 0,
          busted: true,
        };
        const visit = [...state.currentVisit, record];
        const isVisitEnd = visit.length >= 3;

        return {
          ...state,
          throwCount: state.throwCount + 1,
          currentVisit: isVisitEnd ? [] : visit,
          visits: isVisitEnd ? [...state.visits, visit] : state.visits,
          busted: !isVisitEnd,
          score: isVisitEnd ? state.scoreAtVisitStart : state.score,
          scoreAtVisitStart: isVisitEnd
            ? state.scoreAtVisitStart
            : state.scoreAtVisitStart,
        };
      }

      const points = action.segment.number * action.segment.multiplier;
      const newScore = state.score - points;
      const busted = isBust(newScore, state.outMode, action.segment);

      const record: X01ThrowRecord = {
        segment: action.segment,
        points: busted ? 0 : points,
        busted,
      };

      if (busted) {
        const visit = [...state.currentVisit, record];
        const isVisitEnd = visit.length >= 3;

        return {
          ...state,
          throwCount: state.throwCount + 1,
          currentVisit: isVisitEnd ? [] : visit,
          visits: isVisitEnd ? [...state.visits, visit] : state.visits,
          score: isVisitEnd ? state.scoreAtVisitStart : state.score,
          scoreAtVisitStart: isVisitEnd
            ? state.scoreAtVisitStart
            : state.scoreAtVisitStart,
          busted: !isVisitEnd,
        };
      }

      // Valid throw
      if (newScore === 0) {
        const visit = [...state.currentVisit, record];
        return {
          ...state,
          phase: "complete",
          score: 0,
          throwCount: state.throwCount + 1,
          currentVisit: [],
          visits: [...state.visits, visit],
          busted: false,
        };
      }

      const visit = [...state.currentVisit, record];
      const isVisitEnd = visit.length >= 3;

      return {
        ...state,
        score: newScore,
        throwCount: state.throwCount + 1,
        currentVisit: isVisitEnd ? [] : visit,
        visits: isVisitEnd ? [...state.visits, visit] : state.visits,
        scoreAtVisitStart: isVisitEnd ? newScore : state.scoreAtVisitStart,
        busted: false,
      };
    }

    case "RESET":
      return createInitialState({
        baseScore: state.targetScore as 301 | 501 | 701,
        outMode: state.outMode,
      });

    default:
      return state;
  }
}

export function useX01GameLogic(config: X01Config) {
  const [state, dispatch] = useReducer(
    reducer,
    config,
    createInitialState,
  );

  const registerThrow = useCallback(
    (segment: Segment) => dispatch({ type: "REGISTER_THROW", segment }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, registerThrow, reset };
}
