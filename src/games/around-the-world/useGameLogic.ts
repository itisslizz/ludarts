"use client";

import { useReducer, useCallback } from "react";
import { SEQUENCE } from "@/lib/constants";
import type { ATWState, Segment, ATWThrowRecord } from "@/lib/types";

type Action =
  | { type: "REGISTER_THROW"; segment: Segment }
  | { type: "RESET" };

const initialState: ATWState = {
  phase: "playing",
  currentTargetIndex: 0,
  throwCount: 0,
  history: [],
};

function reducer(state: ATWState, action: Action): ATWState {
  switch (action.type) {
    case "REGISTER_THROW": {
      if (state.phase !== "playing") return state;

      const currentTarget = SEQUENCE[state.currentTargetIndex];
      const hit = action.segment.number === currentTarget;
      const record: ATWThrowRecord = {
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

export function useATWGameLogic() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const registerThrow = useCallback(
    (segment: Segment) => dispatch({ type: "REGISTER_THROW", segment }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const currentTarget =
    state.currentTargetIndex < SEQUENCE.length
      ? SEQUENCE[state.currentTargetIndex]
      : null;

  return { state, currentTarget, registerThrow, reset };
}
