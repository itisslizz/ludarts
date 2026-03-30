"use client";

import { useReducer, useCallback } from "react";
import { SEQUENCE } from "@/lib/constants";
import type { GameState, Segment, ThrowRecord } from "@/lib/types";

type Action =
  | { type: "START_GAME" }
  | { type: "REGISTER_THROW"; segment: Segment }
  | { type: "RESET" };

const initialState: GameState = {
  phase: "idle",
  currentTargetIndex: 0,
  throwCount: 0,
  history: [],
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "START_GAME":
      return { ...initialState, phase: "playing" };

    case "REGISTER_THROW": {
      if (state.phase !== "playing") return state;

      const currentTarget = SEQUENCE[state.currentTargetIndex];
      const hit = action.segment.number === currentTarget;
      const record: ThrowRecord = {
        target: currentTarget,
        segment: action.segment,
        hit,
      };

      const nextTargetIndex = hit
        ? state.currentTargetIndex + 1
        : state.currentTargetIndex;

      const isComplete = nextTargetIndex >= SEQUENCE.length;

      return {
        phase: isComplete ? "complete" : "playing",
        currentTargetIndex: nextTargetIndex,
        throwCount: state.throwCount + 1,
        history: [...state.history, record],
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startGame = useCallback(() => dispatch({ type: "START_GAME" }), []);
  const registerThrow = useCallback(
    (segment: Segment) => dispatch({ type: "REGISTER_THROW", segment }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const currentTarget =
    state.currentTargetIndex < SEQUENCE.length
      ? SEQUENCE[state.currentTargetIndex]
      : null;

  return { state, currentTarget, startGame, registerThrow, reset };
}
