"use client";

import { ATWGameView } from "@/games/around-the-world/GameView";
import { X01GameView } from "@/games/x01/GameView";
import type { Segment, GameConfig, X01Config } from "@/lib/types";

interface GameScreenProps {
  gameId: string;
  playerIds: string[];
  config: GameConfig;
  onThrowDetected: (handler: (segment: Segment) => void) => void;
  onQuit: () => void;
  onPlayAgain: () => void;
}

export function GameScreen({
  gameId,
  config,
  onThrowDetected,
  onQuit,
  onPlayAgain,
}: GameScreenProps) {
  switch (gameId) {
    case "around-the-world":
      return (
        <ATWGameView
          onThrowDetected={onThrowDetected}
          onQuit={onQuit}
          onPlayAgain={onPlayAgain}
        />
      );
    case "x01":
      return (
        <X01GameView
          config={config as unknown as X01Config}
          onThrowDetected={onThrowDetected}
          onQuit={onQuit}
          onPlayAgain={onPlayAgain}
        />
      );
    default:
      return (
        <div className="flex flex-1 items-center justify-center">
          <p>Unknown game: {gameId}</p>
        </div>
      );
  }
}
