"use client";

import type { Segment } from "@/lib/types";

interface ScorePickerProps {
  onSelect: (segment: Segment) => void;
}

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

type Multiplier = 1 | 2 | 3;

function makeSegment(number: number, multiplier: Multiplier): Segment {
  const prefix = multiplier === 3 ? "t" : multiplier === 2 ? "d" : "s";
  return {
    number,
    multiplier,
    name: number === 25 ? (multiplier === 2 ? "bullseye" : "bull") : `${prefix}${number}`,
    bed: multiplier === 3 ? "triple" : multiplier === 2 ? "double" : "singleouter",
  };
}

const missSegment: Segment = {
  number: 0,
  multiplier: 1,
  name: "miss",
  bed: "outside",
};

function NumberGrid({
  multiplier,
  onSelect,
  label,
  btnClass,
}: {
  multiplier: Multiplier;
  onSelect: (segment: Segment) => void;
  label: string;
  btnClass: string;
}) {
  const prefix = multiplier === 3 ? "T" : multiplier === 2 ? "D" : "";
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <div className="grid grid-cols-5 gap-2">
        {NUMBERS.map((n) => (
          <button
            key={n}
            onClick={() => onSelect(makeSegment(n, multiplier))}
            className={`rounded py-4 text-center text-sm font-semibold transition-colors ${btnClass}`}
          >
            {prefix}{n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ScorePicker({ onSelect }: ScorePickerProps) {
  return (
    <div className="flex w-full max-w-5xl flex-col gap-4">
      {/* Three-column grid: Singles | Doubles | Triples */}
      <div className="grid grid-cols-3 gap-6">
        <NumberGrid
          multiplier={1}
          onSelect={onSelect}
          label="Single"
          btnClass="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        />
        <NumberGrid
          multiplier={2}
          onSelect={onSelect}
          label="Double"
          btnClass="bg-green-600/15 text-green-700 hover:bg-green-600/25 dark:text-green-400"
        />
        <NumberGrid
          multiplier={3}
          onSelect={onSelect}
          label="Triple"
          btnClass="bg-red-600/15 text-red-700 hover:bg-red-600/25 dark:text-red-400"
        />
      </div>

      {/* Single-Bull, Bull, Miss */}
      <div className="flex gap-2">
        <button
          onClick={() => onSelect(makeSegment(25, 1))}
          className="flex-1 rounded bg-green-600/15 py-4 text-center text-sm font-semibold text-green-700 transition-colors hover:bg-green-600/25 dark:text-green-400"
        >
          Single-Bull (25)
        </button>
        <button
          onClick={() => onSelect(makeSegment(25, 2))}
          className="flex-1 rounded bg-red-600/15 py-4 text-center text-sm font-semibold text-red-700 transition-colors hover:bg-red-600/25 dark:text-red-400"
        >
          Bull (50)
        </button>
        <button
          onClick={() => onSelect(missSegment)}
          className="flex-1 rounded bg-zinc-200 py-4 text-center text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
        >
          Miss
        </button>
      </div>
    </div>
  );
}
