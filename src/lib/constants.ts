// Target sequence for Around The World: 1-20 then bullseye (25)
export const SEQUENCE = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25,
];

// Clockwise segment order starting from top
export const BOARD_ORDER = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
];

// Dartboard radii (SVG units, board centered at 0,0)
export const RADII = {
  doubleOuter: 170,
  doubleInner: 162,
  tripleOuter: 107,
  tripleInner: 99,
  bull: 16,
  bullseye: 6.35,
};

// Each segment spans 18 degrees (360 / 20)
const SEGMENT_ANGLE = 18;
// Offset so segment boundaries fall between numbers (rotated by half a segment)
const ANGLE_OFFSET = -90 - SEGMENT_ANGLE / 2;

function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function polarToCartesian(angle: number, radius: number): { x: number; y: number } {
  const rad = degreesToRadians(angle);
  return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) };
}

// Generate SVG arc path for an annular sector
export function sectorPath(
  segmentIndex: number,
  innerRadius: number,
  outerRadius: number,
): string {
  const startAngle = ANGLE_OFFSET + segmentIndex * SEGMENT_ANGLE;
  const endAngle = startAngle + SEGMENT_ANGLE;

  const outerStart = polarToCartesian(startAngle, outerRadius);
  const outerEnd = polarToCartesian(endAngle, outerRadius);
  const innerStart = polarToCartesian(startAngle, innerRadius);
  const innerEnd = polarToCartesian(endAngle, innerRadius);

  const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    `Z`,
  ].join(" ");
}

// Get the angle for placing a number label
export function labelPosition(segmentIndex: number): { x: number; y: number } {
  const angle = ANGLE_OFFSET + segmentIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  return polarToCartesian(angle, 190);
}
