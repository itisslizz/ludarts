"use client";

import { useEffect, useMemo, useRef } from "react";
import { BOARD_ORDER, RADII, sectorPath, labelPosition } from "@/lib/constants";

interface DartHeatmapProps {
  darts: { x: number; y: number }[];
}

function segmentColors(index: number): { single: string; ring: string } {
  if (index % 2 === 0) {
    return { single: "#1a1a1a", ring: "#e8282b" };
  }
  return { single: "#f5e6c8", ring: "#1b8a42" };
}

// Classic thermal: blue → cyan → green → yellow → red
function thermalColor(t: number): [number, number, number] {
  if (t < 0.25) {
    const s = t / 0.25;
    return [0, Math.round(s * 200), Math.round(200 + s * 55)];
  }
  if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return [0, Math.round(200 + s * 55), Math.round(255 - s * 255)];
  }
  if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return [Math.round(s * 255), 255, 0];
  }
  const s = (t - 0.75) / 0.25;
  return [255, Math.round(255 - s * 255), 0];
}

const SIZE = 420;
const HALF = SIZE / 2;
const BLOB_RADIUS = 9;

function buildHeatmapDataUrl(darts: { x: number; y: number }[]): string {
  // Accumulate density using additive blending
  const densityCanvas = document.createElement("canvas");
  densityCanvas.width = SIZE;
  densityCanvas.height = SIZE;
  const dctx = densityCanvas.getContext("2d")!;
  dctx.globalCompositeOperation = "lighter";

  // Build density using a float array to avoid canvas clamping issues
  const density = new Float32Array(SIZE * SIZE);

  for (const d of darts) {
    const cx = d.x * RADII.doubleOuter + HALF;
    const cy = -d.y * RADII.doubleOuter + HALF;

    const x0 = Math.max(0, Math.floor(cx - BLOB_RADIUS));
    const x1 = Math.min(SIZE - 1, Math.ceil(cx + BLOB_RADIUS));
    const y0 = Math.max(0, Math.floor(cy - BLOB_RADIUS));
    const y1 = Math.min(SIZE - 1, Math.ceil(cy + BLOB_RADIUS));

    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= BLOB_RADIUS) continue;
        // Linear falloff from 1 at center to 0 at edge
        density[py * SIZE + px] += 1 - dist / BLOB_RADIUS;
      }
    }
  }

  const outCanvas = document.createElement("canvas");
  outCanvas.width = SIZE;
  outCanvas.height = SIZE;
  const ctx = outCanvas.getContext("2d")!;
  const imageData = ctx.createImageData(SIZE, SIZE);

  // Absolute scale: a single dart center has density=1, need ~3 overlapping to hit red
  const saturation = 3;

  for (let i = 0; i < density.length; i++) {
    if (density[i] === 0) continue;
    const t = Math.min(density[i] / saturation, 1);
    const [r, g, b] = thermalColor(t);
    const idx = i * 4;
    imageData.data[idx] = r;
    imageData.data[idx + 1] = g;
    imageData.data[idx + 2] = b;
    imageData.data[idx + 3] = Math.round(20 + t * 205);
  }

  ctx.putImageData(imageData, 0, 0);
  return outCanvas.toDataURL();
}

export function DartHeatmap({ darts }: DartHeatmapProps) {
  const imgRef = useRef<SVGImageElement>(null);

  const heatmapUrl = useMemo(() => {
    if (typeof document === "undefined" || darts.length === 0) return "";
    return buildHeatmapDataUrl(darts);
  }, [darts]);

  useEffect(() => {
    if (imgRef.current && heatmapUrl) {
      imgRef.current.setAttribute("href", heatmapUrl);
    }
  }, [heatmapUrl]);

  return (
    <svg viewBox="-210 -210 420 420" className="w-full max-w-md">
      {/* Board background */}
      <circle r={RADII.doubleOuter} fill="#1a1a1a" />

      {BOARD_ORDER.map((number, i) => {
        const colors = segmentColors(i);
        return (
          <g key={number} opacity={0.4}>
            <path d={sectorPath(i, RADII.doubleInner, RADII.tripleOuter)} fill={colors.single} />
            <path d={sectorPath(i, RADII.doubleInner, RADII.doubleOuter)} fill={colors.ring} />
            <path d={sectorPath(i, RADII.tripleInner, RADII.tripleOuter)} fill={colors.ring} />
            <path d={sectorPath(i, RADII.bull, RADII.tripleInner)} fill={colors.single} />
          </g>
        );
      })}

      <circle r={RADII.bull} fill="#1b8a42" opacity={0.4} />
      <circle r={RADII.bullseye} fill="#e8282b" opacity={0.4} />

      {/* Heatmap overlay */}
      {heatmapUrl && (
        <image
          ref={imgRef}
          x={-HALF}
          y={-HALF}
          width={SIZE}
          height={SIZE}
          href={heatmapUrl}
        />
      )}

      {/* Wire rings */}
      {[RADII.doubleOuter, RADII.doubleInner, RADII.tripleOuter, RADII.tripleInner, RADII.bull, RADII.bullseye].map(
        (r) => (
          <circle key={r} r={r} fill="none" stroke="#555" strokeWidth={0.5} />
        ),
      )}

      {/* Wire lines */}
      {BOARD_ORDER.map((_, i) => {
        const angle = -90 - 9 + i * 18;
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={RADII.bull * Math.cos(rad)}
            y1={RADII.bull * Math.sin(rad)}
            x2={RADII.doubleOuter * Math.cos(rad)}
            y2={RADII.doubleOuter * Math.sin(rad)}
            stroke="#555"
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
            className="fill-zinc-400 text-[14px] font-bold"
          >
            {number}
          </text>
        );
      })}
    </svg>
  );
}
