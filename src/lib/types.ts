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

export interface Player {
  id: string;
  name: string;
}

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
}

export type AppView =
  | { screen: "home" }
  | { screen: "player-select"; gameId: string }
  | { screen: "playing"; gameId: string; playerIds: string[] };

export type GamePhase = "playing" | "complete";

export interface GameState {
  phase: GamePhase;
  currentTargetIndex: number;
  throwCount: number;
  history: ThrowRecord[];
}
