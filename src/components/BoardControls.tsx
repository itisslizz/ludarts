"use client";

import { useCallback, useState } from "react";

interface BoardControlsProps {
  boardRunning: boolean | null;
}

async function boardAction(action: string, method: "PUT" | "POST") {
  const res = await fetch(`/api/autodarts/${action}`, { method });
  return res.ok;
}

export function BoardControls({ boardRunning }: BoardControlsProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const handleAction = useCallback(
    async (action: string, method: "PUT" | "POST") => {
      setBusy(action);
      try {
        await boardAction(action, method);
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const statusLabel =
    boardRunning === null
      ? "Board offline"
      : boardRunning
        ? "Board running"
        : "Board stopped";

  const statusColor =
    boardRunning === null
      ? "text-zinc-400"
      : boardRunning
        ? "text-green-500"
        : "text-red-500";

  return (
    <div className="flex items-center gap-4">
      <span className={`text-sm font-medium ${statusColor}`}>
        {statusLabel}
      </span>
      <div className="flex gap-2">
        {boardRunning ? (
          <button
            onClick={() => handleAction("stop", "PUT")}
            disabled={busy !== null}
            className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {busy === "stop" ? "Stopping…" : "Stop Board"}
          </button>
        ) : (
          <button
            onClick={() => handleAction("start", "PUT")}
            disabled={busy !== null || boardRunning === null}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
          >
            {busy === "start" ? "Starting…" : "Start Board"}
          </button>
        )}
        <button
          onClick={() => handleAction("reset", "POST")}
          disabled={busy !== null || boardRunning === null}
          className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          {busy === "reset" ? "Resetting…" : "Reset Board"}
        </button>
      </div>
    </div>
  );
}
