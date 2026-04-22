"use client";

import { useState } from "react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { getGame } from "@/lib/games";

interface PlayerSelectScreenProps {
  gameId: string;
  onStart: (playerIds: string[]) => void;
  onBack: () => void;
}

// Generate a consistent color for a player ID
function getPlayerColor(playerId: string): string {
  const colors = [
    "#ef4444", // red
    "#f59e0b", // amber
    "#10b981", // emerald
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#84cc16", // lime
    "#6366f1", // indigo
  ];
  
  // Simple hash function for consistent color selection
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface PlayerCircleProps {
  player: { id: string; name: string };
  isSelected: boolean;
  onClick: () => void;
  showOrder?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  isDraggedOver?: boolean;
  isDragging?: boolean;
}

function PlayerCircle({
  player,
  isSelected,
  onClick,
  showOrder,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  isDraggedOver = false,
  isDragging = false,
}: PlayerCircleProps) {
  const color = getPlayerColor(player.id);
  const [touchMoved, setTouchMoved] = useState(false);
  
  const handleTouchStartLocal = (e: React.TouchEvent) => {
    setTouchMoved(false);
    onTouchStart?.(e);
  };

  const handleTouchMoveLocal = (e: React.TouchEvent) => {
    setTouchMoved(true);
    onTouchMove?.(e);
  };

  const handleTouchEndLocal = (e: React.TouchEvent) => {
    onTouchEnd?.(e);
    setTouchMoved(false);
  };

  const handleClickLocal = () => {
    // Prevent click if it was a touch drag
    if (!touchMoved) {
      onClick();
    }
  };
  
  return (
    <div 
      className={`flex flex-col items-center gap-3 group ${isDraggedOver ? 'scale-110' : ''} ${isDragging ? 'opacity-50' : ''} transition-all`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onTouchStart={handleTouchStartLocal}
      onTouchMove={handleTouchMoveLocal}
      onTouchEnd={handleTouchEndLocal}
    >
      <div className="relative">
        <button
          onClick={handleClickLocal}
          className={`relative flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${draggable ? 'cursor-move touch-none' : ''} ${isDragging ? 'scale-110' : 'hover:scale-110'}`}
          style={{ backgroundColor: color }}
        >
          {showOrder !== undefined ? (
            <span>{showOrder}</span>
          ) : (
            <span className="text-base">{player.name.substring(0, 2).toUpperCase()}</span>
          )}
          
          {/* Selected indicator for bottom row */}
          {!showOrder && isSelected && (
            <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-sm font-bold border-2 border-white">
              ✓
            </div>
          )}
        </button>
        
        {/* Reorder buttons for selected players */}
        {showOrder !== undefined && onMoveUp && onMoveDown && (
          <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={!canMoveUp}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move up"
            >
              ↑
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={!canMoveDown}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move down"
            >
              ↓
            </button>
          </div>
        )}
      </div>
      
      <span className="text-center text-sm font-medium max-w-[90px] truncate">
        {player.name}
      </span>
    </div>
  );
}

export function PlayerSelectScreen({
  gameId,
  onStart,
  onBack,
}: PlayerSelectScreenProps) {
  const game = getGame(gameId);
  const { players, addPlayer } = usePlayerStore();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);

  const isSingleSelect = game?.maxPlayers === 1;

  function togglePlayer(id: string) {
    if (selectedPlayerIds.includes(id)) {
      // Remove from selected
      setSelectedPlayerIds((prev) => prev.filter((pid) => pid !== id));
    } else {
      // Add to selected
      if (game && selectedPlayerIds.length >= game.maxPlayers) return;
      setSelectedPlayerIds((prev) => 
        isSingleSelect ? [id] : [...prev, id]
      );
    }
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setSelectedPlayerIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === selectedPlayerIds.length - 1) return;
    setSelectedPlayerIds((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    setSelectedPlayerIds((prev) => {
      const next = [...prev];
      const [draggedItem] = next.splice(draggedIndex, 1);
      next.splice(dropIndex, 0, draggedItem);
      return next;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleTouchStart(e: React.TouchEvent, index: number) {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setDraggedIndex(index);
  }

  function handleTouchMove(e: React.TouchEvent, index: number) {
    if (draggedIndex === null || !touchStartPos) return;
    
    const touch = e.touches[0];
    const moveX = Math.abs(touch.clientX - touchStartPos.x);
    const moveY = Math.abs(touch.clientY - touchStartPos.y);
    
    // If moved significantly, find which player we're over
    if (moveX > 20 || moveY > 20) {
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const playerElement = element?.closest('[data-player-index]');
      if (playerElement) {
        const overIndex = parseInt(playerElement.getAttribute('data-player-index') || '-1');
        if (overIndex >= 0 && overIndex !== draggedIndex) {
          setDragOverIndex(overIndex);
        }
      }
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (draggedIndex === null) return;

    if (dragOverIndex !== null && dragOverIndex !== draggedIndex) {
      setSelectedPlayerIds((prev) => {
        const next = [...prev];
        const [draggedItem] = next.splice(draggedIndex, 1);
        next.splice(dragOverIndex, 0, draggedItem);
        return next;
      });
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setTouchStartPos(null);
  }

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    const player = await addPlayer(trimmed);
    setNewName("");
    
    // Auto-select if under max
    if (!game || selectedPlayerIds.length < game.maxPlayers) {
      togglePlayer(player.id);
    }
  }

  const canStart =
    game != null &&
    selectedPlayerIds.length >= game.minPlayers &&
    selectedPlayerIds.length <= game.maxPlayers;

  return (
    <div className="flex flex-col h-full w-full -mx-6 -my-8">
      {/* Top Bar with Actions */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b-2 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <button
          onClick={onBack}
          className="rounded-xl border-2 border-zinc-300 px-8 py-3 text-lg font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Back
        </button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold">{game?.name ?? "Unknown Game"}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Select{" "}
            {isSingleSelect
              ? "a player"
              : `${game?.minPlayers}–${game?.maxPlayers} players`}
          </p>
        </div>
        
        <button
          onClick={() => onStart(selectedPlayerIds)}
          disabled={!canStart}
          className="rounded-xl bg-green-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Game
        </button>
      </div>

      {/* Selected Players Row (Center) */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-y-auto">
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl font-semibold text-center mb-6 text-zinc-700 dark:text-zinc-300">
            Selected Players {selectedPlayerIds.length > 0 && `(${selectedPlayerIds.length})`}
          </h2>
          
          <div className="flex justify-center items-center gap-8 flex-wrap min-h-[150px] rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-8 dark:border-zinc-700 dark:bg-zinc-900/50">
            {selectedPlayerIds.length === 0 ? (
              <p className="text-xl text-zinc-400 dark:text-zinc-500">
                Select players from below
              </p>
            ) : (
              selectedPlayerIds.map((playerId, index) => {
                const player = players.find((p) => p.id === playerId);
                if (!player) return null;
                
                return (
                  <div key={playerId} data-player-index={index}>
                    <PlayerCircle
                      player={player}
                      isSelected={true}
                      onClick={() => togglePlayer(playerId)}
                      showOrder={index + 1}
                      onMoveUp={() => moveUp(index)}
                      onMoveDown={() => moveDown(index)}
                      canMoveUp={index > 0 && !isSingleSelect && selectedPlayerIds.length > 1}
                      canMoveDown={index < selectedPlayerIds.length - 1 && !isSingleSelect && selectedPlayerIds.length > 1}
                      draggable={!isSingleSelect && selectedPlayerIds.length > 1}
                      onDragStart={(e) => handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onTouchStart={(e) => handleTouchStart(e, index)}
                      onTouchMove={(e) => handleTouchMove(e, index)}
                      onTouchEnd={handleTouchEnd}
                      isDraggedOver={dragOverIndex === index}
                      isDragging={draggedIndex === index}
                    />
                  </div>
                );
              })
            )}
          </div>
          
          {/* Add player form */}
          <form onSubmit={handleAddPlayer} className="flex gap-3 mt-6 max-w-md mx-auto">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Add new player"
              className="flex-1 rounded-xl border-2 border-zinc-200 bg-white px-6 py-3 text-lg outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-500"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="rounded-xl bg-zinc-200 px-6 py-3 text-lg font-medium text-zinc-800 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              Add
            </button>
          </form>
        </div>
      </div>

      {/* All Players Row (Bottom) */}
      <div className="flex-shrink-0 border-t-2 border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/80 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-4 text-zinc-700 dark:text-zinc-300">
            All Players
          </h2>
          
          {players.length === 0 ? (
            <p className="text-center text-lg text-zinc-400 dark:text-zinc-500 py-8">
              No players yet. Add one above to get started.
            </p>
          ) : (
            <div className="flex justify-center items-center gap-8 flex-wrap">
              {players.map((player) => (
                <PlayerCircle
                  key={player.id}
                  player={player}
                  isSelected={selectedPlayerIds.includes(player.id)}
                  onClick={() => togglePlayer(player.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
