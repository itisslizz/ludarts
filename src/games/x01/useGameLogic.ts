"use client";

import { useReducer, useCallback } from "react";
import type {
  X01State,
  X01Config,
  X01LegData,
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
  | { type: "CONTINUE_TO_NEXT_LEG" }
  | { type: "RESET" };

function createInitialState({ config, playerIds }: X01InitArgs): X01State {
  return {
    phase: "playing",
    targetScore: config.baseScore,
    outMode: config.outMode,
    firstTo: config.firstTo,
    eloEnabled: config.eloEnabled,
    playerIds,
    players: playerIds.map((id) => ({
      playerId: id,
      score: config.baseScore,
      scoreAtVisitStart: config.baseScore,
      visits: [],
      legsWon: 0,
    })),
    currentPlayerIndex: 0,
    currentVisit: [],
    throwCount: 0,
    busted: false,
    waitingForTakeout: false,
    winnerId: null,
    currentLeg: 1,
    completedLegs: [],
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

function startNewLeg(state: X01State, completedLegData: X01LegData): X01State {
  // Rotate playerIds: move first player to the back
  const rotatedPlayerIds = [...state.playerIds.slice(1), state.playerIds[0]];
  
  // Rotate players array to match the new order
  const rotatedPlayers = [...state.players.slice(1), state.players[0]].map((p) => ({
    ...p,
    score: state.targetScore,
    scoreAtVisitStart: state.targetScore,
    visits: [],
  }));

  return {
    ...state,
    phase: "playing",
    playerIds: rotatedPlayerIds,
    players: rotatedPlayers,
    currentPlayerIndex: 0,
    currentVisit: [],
    throwCount: 0,
    busted: false,
    waitingForTakeout: false,
    winnerId: null,
    currentLeg: state.currentLeg + 1,
    completedLegs: [...state.completedLegs, completedLegData],
  };
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
      if (state.phase !== "playing" || state.waitingForTakeout) return state;

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

      // Busted — revert score and wait for takeout before advancing
      if (busted) {
        return {
          ...state,
          players: state.players.map((p, i) =>
            i === state.currentPlayerIndex
              ? { ...p, score: cp.scoreAtVisitStart }
              : p,
          ),
          throwCount: state.throwCount + 1,
          currentVisit: visit,
          busted: true,
          waitingForTakeout: true,
        };
      }

      // Checked out — leg won!
      if (newScore === 0) {
        const updatedPlayers = state.players.map((p, i) =>
          i === state.currentPlayerIndex 
            ? { ...p, score: 0, visits: [...p.visits, visit], legsWon: p.legsWon + 1 } 
            : p,
        );
        
        const currentPlayer = updatedPlayers[state.currentPlayerIndex];
        const hasWonMatch = currentPlayer.legsWon >= state.firstTo;
        
        // Create leg data for this completed leg
        const legData: X01LegData = {
          legNumber: state.currentLeg,
          winnerId: cp.playerId,
          players: updatedPlayers.map((p) => ({
            playerId: p.playerId,
            visits: p.visits,
          })),
        };
        
        if (hasWonMatch) {
          // Match complete - add final leg to completedLegs
          return {
            ...state,
            phase: "complete",
            players: updatedPlayers,
            throwCount: state.throwCount + 1,
            currentVisit: [],
            busted: false,
            waitingForTakeout: false,
            winnerId: cp.playerId,
            completedLegs: [...state.completedLegs, legData],
          };
        } else {
          // Leg complete but match continues - show leg complete screen
          return {
            ...state,
            phase: "legComplete",
            players: updatedPlayers,
            throwCount: state.throwCount + 1,
            currentVisit: [],
            busted: false,
            waitingForTakeout: false,
            winnerId: cp.playerId,
            completedLegs: [...state.completedLegs, legData],
          };
        }
      }

      // Valid throw, update player score
      const updatedPlayers = state.players.map((p, i) =>
        i === state.currentPlayerIndex ? { ...p, score: newScore } : p,
      );

      const isVisitEnd = visit.length >= 3;

      // 3 darts thrown — wait for takeout before advancing
      if (isVisitEnd) {
        return {
          ...state,
          players: updatedPlayers.map((p, i) =>
            i === state.currentPlayerIndex
              ? { ...p, scoreAtVisitStart: newScore }
              : p,
          ),
          throwCount: state.throwCount + 1,
          currentVisit: visit,
          busted: false,
          waitingForTakeout: true,
        };
      }

      return {
        ...state,
        players: updatedPlayers,
        throwCount: state.throwCount + 1,
        currentVisit: visit,
        busted: false,
      };
    }

    case "END_TURN": {
      if (state.phase !== "playing") return state;
      if (state.currentVisit.length === 0) return state;

      let visit = state.currentVisit;
      
      // If visit has fewer than 3 darts and is not busted, pad with misses
      const isBusted = visit.some((t) => t.busted);
      if (!isBusted && visit.length < 3) {
        const missSegment: Segment = {
          number: 0,
          multiplier: 1,
          name: "miss",
          bed: "outside",
        };
        
        const missRecord: X01ThrowRecord = {
          segment: missSegment,
          points: 0,
          busted: false,
        };
        
        // Add misses to fill up to 3 darts
        const missesToAdd = 3 - visit.length;
        visit = [...visit, ...Array(missesToAdd).fill(missRecord)];
      }

      const nextState = {
        ...state,
        waitingForTakeout: false,
        players: state.players.map((p, i) =>
          i === state.currentPlayerIndex
            ? { ...p, scoreAtVisitStart: p.score }
            : p,
        ),
      };
      return advancePlayer(nextState, visit);
    }

    case "UNDO": {

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
          waitingForTakeout: false,
          winnerId: null,
        };
      }

      // Current visit is empty — go back to previous player's entire last visit
      const prevPlayerIndex =
        (state.currentPlayerIndex - 1 + state.playerIds.length) %
        state.playerIds.length;
      const prevPlayer = state.players[prevPlayerIndex];

      if (prevPlayer.visits.length === 0) return state;

      const lastVisit = prevPlayer.visits[prevPlayer.visits.length - 1];

      // Calculate scores: prevPlayer.score is the score after the visit was completed
      const visitWasBusted = lastVisit.some((t) => t.busted);
      const totalPoints = lastVisit.reduce((sum, t) => sum + t.points, 0);
      
      // Score at the END of the visit (current score)
      const scoreAtEndOfVisit = prevPlayer.score;
      
      // Score at the START of the visit (for undoing)
      const scoreAtStartOfVisit = visitWasBusted
        ? prevPlayer.score  // If busted, score was reverted, so end = start
        : prevPlayer.score + totalPoints;  // If not busted, add back the points

      const stillBusted = lastVisit.some((t) => t.busted);

      // Restore the entire previous visit as the current visit
      // Set waitingForTakeout to true so the user cannot add a 4th dart
      return {
        ...state,
        phase: "playing",
        currentPlayerIndex: prevPlayerIndex,
        players: state.players.map((p, i) =>
          i === prevPlayerIndex
            ? {
                ...p,
                score: scoreAtEndOfVisit,
                scoreAtVisitStart: scoreAtStartOfVisit,
                visits: p.visits.slice(0, -1),
              }
            : p,
        ),
        currentVisit: lastVisit,
        throwCount: state.throwCount - lastVisit.length,
        busted: stillBusted,
        waitingForTakeout: true,
        winnerId: null,
      };
    }

    case "CONTINUE_TO_NEXT_LEG": {
      if (state.phase !== "legComplete") return state;
      
      // Rotate playerIds: move first player to the back
      const rotatedPlayerIds = [...state.playerIds.slice(1), state.playerIds[0]];
      
      // Rotate players array to match the new order and reset for new leg
      const rotatedPlayers = [...state.players.slice(1), state.players[0]].map((p) => ({
        ...p,
        score: state.targetScore,
        scoreAtVisitStart: state.targetScore,
        visits: [],
      }));

      return {
        ...state,
        phase: "playing",
        playerIds: rotatedPlayerIds,
        players: rotatedPlayers,
        currentPlayerIndex: 0,
        currentVisit: [],
        throwCount: 0,
        busted: false,
        waitingForTakeout: false,
        winnerId: null,
        currentLeg: state.currentLeg + 1,
      };
    }

    case "RESET": {
      // Rotate playerIds: move first player to the back
      const rotatedPlayerIds = [...state.playerIds.slice(1), state.playerIds[0]];
      
      return createInitialState({
        config: {
          baseScore: state.targetScore as 301 | 501 | 701,
          outMode: state.outMode,
          firstTo: state.firstTo,
          eloEnabled: state.eloEnabled,
        },
        playerIds: rotatedPlayerIds,
      });
    }

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
  const continueToNextLeg = useCallback(() => dispatch({ type: "CONTINUE_TO_NEXT_LEG" }), []);

  return { state, registerThrow, endTurn, undo, reset, continueToNextLeg };
}
