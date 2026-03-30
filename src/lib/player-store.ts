import type { Player } from "@/lib/types";

export interface PlayerStore {
  getAll(): Promise<Player[]>;
  add(name: string): Promise<Player>;
  remove(id: string): Promise<void>;
}

// --- localStorage implementation ---

const STORAGE_KEY = "autodarts-players";

function read(): Player[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(players: Player[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

export const localPlayerStore: PlayerStore = {
  async getAll() {
    return read();
  },

  async add(name: string) {
    const player: Player = { id: crypto.randomUUID(), name };
    const players = read();
    players.push(player);
    write(players);
    return player;
  },

  async remove(id: string) {
    const players = read().filter((p) => p.id !== id);
    write(players);
  },
};
