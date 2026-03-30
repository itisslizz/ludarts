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

// --- Around The World ---

export interface ATWThrowRecord {
  target: number;
  segment: Segment;
  hit: boolean;
}

export type ATWPhase = "playing" | "complete";

export interface ATWState {
  phase: ATWPhase;
  currentTargetIndex: number;
  throwCount: number;
  history: ATWThrowRecord[];
}

// --- X01 ---

export interface X01Config {
  baseScore: 301 | 501 | 701;
  outMode: "double" | "straight";
}

export interface X01ThrowRecord {
  segment: Segment;
  points: number;
  busted: boolean;
}

export type X01Phase = "playing" | "complete";

export interface X01State {
  phase: X01Phase;
  targetScore: number;
  outMode: "double" | "straight";
  score: number;
  scoreAtVisitStart: number;
  currentVisit: X01ThrowRecord[];
  throwCount: number;
  visits: X01ThrowRecord[][];
  busted: boolean;
}

// --- Player ---

export interface Player {
  id: string;
  name: string;
}

// --- Game registry ---

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  hasConfig: boolean;
}

// --- Navigation ---

export type GameConfig = Record<string, unknown>;

export type AppView =
  | { screen: "home" }
  | { screen: "game-config"; gameId: string }
  | { screen: "player-select"; gameId: string; config: GameConfig }
  | { screen: "playing"; gameId: string; playerIds: string[]; config: GameConfig };
