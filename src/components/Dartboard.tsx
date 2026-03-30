"use client";

import { BOARD_ORDER, RADII, sectorPath, labelPosition } from "@/lib/constants";

interface DartboardProps {
  currentTarget: number | null;
}

// Standard dartboard colors: alternating black/white for segments,
// red/green for doubles and triples
function segmentColors(index: number): { single: string; ring: string } {
  // Even indices: black segment, red ring; Odd indices: white segment, green ring
  if (index % 2 === 0) {
    return { single: "#1a1a1a", ring: "#e8282b" };
  }
  return { single: "#f5e6c8", ring: "#1b8a42" };
}

const HIGHLIGHT = "#facc15";
const HIGHLIGHT_OPACITY = "0.85";

export function Dartboard({ currentTarget }: DartboardProps) {
  return (
    <svg viewBox="-210 -210 420 420" className="w-full max-w-md">
      {/* Wire circle behind everything */}
      <circle r={RADII.doubleOuter} fill="#1a1a1a" />

      {BOARD_ORDER.map((number, i) => {
        const isTarget = number === currentTarget;
        const colors = segmentColors(i);

        return (
          <g key={number}>
            {/* Outer single */}
            <path
              d={sectorPath(i, RADII.doubleInner, RADII.tripleOuter)}
              fill={isTarget ? HIGHLIGHT : colors.single}
              opacity={isTarget ? HIGHLIGHT_OPACITY : 1}
              className={isTarget ? "animate-pulse" : ""}
            />
            {/* Double ring */}
            <path
              d={sectorPath(i, RADII.doubleInner, RADII.doubleOuter)}
              fill={isTarget ? HIGHLIGHT : colors.ring}
              opacity={isTarget ? HIGHLIGHT_OPACITY : 1}
              className={isTarget ? "animate-pulse" : ""}
            />
            {/* Triple ring */}
            <path
              d={sectorPath(i, RADII.tripleInner, RADII.tripleOuter)}
              fill={isTarget ? HIGHLIGHT : colors.ring}
              opacity={isTarget ? HIGHLIGHT_OPACITY : 1}
              className={isTarget ? "animate-pulse" : ""}
            />
            {/* Inner single */}
            <path
              d={sectorPath(i, RADII.bull, RADII.tripleInner)}
              fill={isTarget ? HIGHLIGHT : colors.single}
              opacity={isTarget ? HIGHLIGHT_OPACITY : 1}
              className={isTarget ? "animate-pulse" : ""}
            />
          </g>
        );
      })}

      {/* Bull ring */}
      <circle
        r={RADII.bull}
        fill={currentTarget === 25 ? HIGHLIGHT : "#1b8a42"}
        opacity={currentTarget === 25 ? Number(HIGHLIGHT_OPACITY) : 1}
        className={currentTarget === 25 ? "animate-pulse" : ""}
      />
      {/* Bullseye */}
      <circle
        r={RADII.bullseye}
        fill={currentTarget === 25 ? HIGHLIGHT : "#e8282b"}
        opacity={currentTarget === 25 ? Number(HIGHLIGHT_OPACITY) : 1}
        className={currentTarget === 25 ? "animate-pulse" : ""}
      />

      {/* Wire rings */}
      {[RADII.doubleOuter, RADII.doubleInner, RADII.tripleOuter, RADII.tripleInner, RADII.bull, RADII.bullseye].map(
        (r) => (
          <circle key={r} r={r} fill="none" stroke="#888" strokeWidth={0.5} />
        ),
      )}

      {/* Wire lines between segments */}
      {BOARD_ORDER.map((_, i) => {
        const angle = -90 - 9 + i * 18; // segment boundary angle
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={RADII.bull * Math.cos(rad)}
            y1={RADII.bull * Math.sin(rad)}
            x2={RADII.doubleOuter * Math.cos(rad)}
            y2={RADII.doubleOuter * Math.sin(rad)}
            stroke="#888"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Number labels */}
      {BOARD_ORDER.map((number, i) => {
        const pos = labelPosition(i);
        return (
          <text
            key={number}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground text-[14px] font-bold"
          >
            {number}
          </text>
        );
      })}
    </svg>
  );
}
