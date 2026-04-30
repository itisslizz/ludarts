import type { X01PlayerState, X01ThrowRecord } from "@/lib/types";

export interface X01PlayerStats {
  ppr: number;
  first9Ppr: number;
  checkoutRate: string;
  visits60: number;
  visits100: number;
  visits140: number;
  visits180: number;
  washmachineCount: number;
  totalDarts: number;
}

function visitScore(visit: X01ThrowRecord[]): number {
  return visit.reduce((sum, t) => sum + t.points, 0);
}

function isBustedVisit(visit: X01ThrowRecord[]): boolean {
  return visit.some((t) => t.busted);
}

export function computeStats(
  player: X01PlayerState,
  targetScore: number,
): X01PlayerStats {
  const visits = player.visits;
  // Count darts: busted visits = 3 darts, otherwise actual darts thrown
  const totalDarts = visits.reduce((sum, v) => {
    const busted = isBustedVisit(v);
    return sum + (busted ? 3 : v.length);
  }, 0);
  const totalPoints = targetScore - player.score;

  // PPR (Points Per Round - 3 darts)
  const ppr = totalDarts > 0 ? (totalPoints * 3) / totalDarts : 0;

  // First 9 darts PPR (first 3 visits)
  const first3Visits = visits.slice(0, 3);
  const first9Points = first3Visits.reduce((sum, v) => sum + visitScore(v), 0);
  const first9Visits = first3Visits.length;
  const first9Ppr = first9Visits > 0 ? first9Points / first9Visits : 0;

  // Checkout: count darts thrown at doubles when on a double finish
  // An attempt is when remaining score is a valid double (even number 2-40)
  let doublesAttempted = 0;
  let doublesSuccessful = 0;
  let runningScore = targetScore;

  for (const visit of visits) {
    const busted = isBustedVisit(visit);

    // Track score dart-by-dart within the visit
    for (const dart of visit) {
      // Check if we're on a double finish (even score 2-40, or 50 for bullseye)
      const onDoubleFinish = (runningScore >= 2 && runningScore <= 40 && runningScore % 2 === 0) || runningScore === 50;
      
      if (onDoubleFinish) {
        doublesAttempted++;
        // Check if this dart finished the game
        if (runningScore === dart.points && !dart.busted) {
          doublesSuccessful++;
        }
      }

      // Update running score after this dart (if not busted)
      if (!dart.busted) {
        runningScore -= dart.points;
      }
    }

    // If busted, restore score to start of visit
    if (busted) {
      runningScore += visitScore(visit);
    }
  }

  const checkoutRate =
    doublesAttempted > 0
      ? `${doublesSuccessful}/${doublesAttempted}`
      : "—";

  // Visit score thresholds and Washmachine count (non-busted visits only)
  let visits60 = 0;
  let visits100 = 0;
  let visits140 = 0;
  let visits180 = 0;
  let washmachineCount = 0;

  for (const visit of visits) {
    if (isBustedVisit(visit)) continue;
    const score = visitScore(visit);
    if (score >= 180) visits180++;
    else if (score >= 140) visits140++;
    else if (score >= 100) visits100++;
    else if (score >= 60) visits60++;

    // Washmachine: exactly S20 + S5 + S1 in any order
    if (
      visit.length === 3 &&
      visit.some((t) => t.segment.number === 20 && t.segment.multiplier === 1) &&
      visit.some((t) => t.segment.number === 5  && t.segment.multiplier === 1) &&
      visit.some((t) => t.segment.number === 1  && t.segment.multiplier === 1)
    ) {
      washmachineCount++;
    }
  }

  return {
    ppr,
    first9Ppr,
    checkoutRate,
    visits60,
    visits100,
    visits140,
    visits180,
    washmachineCount,
    totalDarts,
  };
}
