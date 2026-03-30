export interface Segment {
  number: number;
  multiplier: 1 | 2 | 3;
  name: string;
  bed: string;
}

export interface DartThrow {
  segment: Segment;
  coords: { x: number; y: number };
}

export interface AutodartsState {
  status: "Throw" | "Takeout" | "InProgress" | "offline";
  running: boolean;
  throws: DartThrow[];
}

export interface ThrowRecord {
  target: number;
  segment: Segment;
  hit: boolean;
}

export type GamePhase = "idle" | "playing" | "complete";

export interface GameState {
  phase: GamePhase;
  currentTargetIndex: number;
  throwCount: number;
  history: ThrowRecord[];
}
