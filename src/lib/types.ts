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

export interface X01PlayerState {
  playerId: string;
  score: number;
  scoreAtVisitStart: number;
  visits: X01ThrowRecord[][];
}

export type X01Phase = "playing" | "complete";

export interface X01State {
  phase: X01Phase;
  targetScore: number;
  outMode: "double" | "straight";
  playerIds: string[];
  players: X01PlayerState[];
  currentPlayerIndex: number;
  currentVisit: X01ThrowRecord[];
  throwCount: number;
  busted: boolean;
  winnerId: string | null;
}

// --- Cricket (standard + hammer) ---

export interface CricketThrowRecord {
  segment: Segment;
  target: number | null;
  marksAdded: number;
  pointsScored: number;
}

export interface CricketPlayerState {
  playerId: string;
  marks: Record<number, number>;
  score: number;
}

export type CricketPhase = "playing" | "complete";

export interface CricketState {
  phase: CricketPhase;
  variant: "cricket" | "hammer";
  targets: number[];
  playerIds: string[];
  players: CricketPlayerState[];
  currentPlayerIndex: number;
  currentVisit: CricketThrowRecord[];
  throwCount: number;
  winnerId: string | null;
}

// --- Got'em ---

export interface GotemThrowRecord {
  segment: Segment;
  target: number | null;
  marksAdded: number;
  pointsScored: number;
  claimed: boolean;
}

export interface GotemPlayerState {
  playerId: string;
  marks: Record<number, number>;
  score: number;
}

export type GotemPhase = "playing" | "complete";

export interface GotemState {
  phase: GotemPhase;
  targets: number[];
  ownership: Record<number, string | null>;
  playerIds: string[];
  players: GotemPlayerState[];
  currentPlayerIndex: number;
  currentVisit: GotemThrowRecord[];
  throwCount: number;
  winnerId: string | null;
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
