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
  firstTo: 1 | 2 | 3;
}

export interface X01ThrowRecord {
  segment: Segment;
  points: number;
  busted: boolean;
  coords?: { x: number; y: number };
}

export interface X01LegData {
  legNumber: number;
  winnerId: string;
  players: {
    playerId: string;
    visits: X01ThrowRecord[][];
  }[];
}

export interface X01PlayerState {
  playerId: string;
  score: number;
  scoreAtVisitStart: number;
  visits: X01ThrowRecord[][];
  legsWon: number;
}

export type X01Phase = "playing" | "legComplete" | "complete";

export interface X01State {
  phase: X01Phase;
  targetScore: number;
  outMode: "double" | "straight";
  firstTo: 1 | 2 | 3;
  playerIds: string[];
  players: X01PlayerState[];
  currentPlayerIndex: number;
  currentVisit: X01ThrowRecord[];
  throwCount: number;
  busted: boolean;
  waitingForTakeout: boolean;
  winnerId: string | null;
  currentLeg: number;
  completedLegs: X01LegData[];
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
  elo_rating?: number; // Optional for backward compatibility
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
  | { screen: "players" }
  | { screen: "player-detail"; playerId: string }
  | { screen: "game-config"; gameId: string }
  | { screen: "player-select"; gameId: string; config: GameConfig }
  | { screen: "playing"; gameId: string; playerIds: string[]; config: GameConfig };

// --- Stats DB types ---

export interface DbPlayer {
  id: string;
  name: string;
  elo_rating: number;
  created_at: string;
}

export interface DbX01Game {
  id: string;
  target_score: number;
  out_mode: string;
  started_at: string;
  finished_at: string | null;
  winner_id: string | null;
}

export interface DbX01GamePlayer {
  game_id: string;
  player_id: string;
  position: number;
  elo_change?: number;
}

export interface DbX01Dart {
  id?: number;
  game_id: string;
  player_id: string;
  visit_number: number;
  dart_index: number;
  segment_name: string;
  segment_number: number;
  segment_multiplier: number;
  score: number;
  is_bust: number;
  coord_x: number | null;
  coord_y: number | null;
}
