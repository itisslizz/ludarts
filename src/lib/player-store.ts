import type { Player } from "@/lib/types";

export interface PlayerStore {
  getAll(): Promise<Player[]>;
  add(name: string): Promise<Player>;
  remove(id: string): Promise<void>;
}

// --- localStorage helpers (for migration) ---

const STORAGE_KEY = "autodarts-players";

function readLocal(): Player[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function clearLocal() {
  localStorage.removeItem(STORAGE_KEY);
}

// --- API-backed implementation ---

async function migrateFromLocalStorage() {
  const local = readLocal();
  if (local.length === 0) return;

  for (const player of local) {
    await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: player.id, name: player.name }),
    });
  }

  clearLocal();
}

export const apiPlayerStore: PlayerStore = {
  async getAll() {
    await migrateFromLocalStorage();
    const res = await fetch("/api/players");
    return res.json();
  },

  async add(name: string) {
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },

  async remove(id: string) {
    await fetch(`/api/players/${id}`, { method: "DELETE" });
  },
};
