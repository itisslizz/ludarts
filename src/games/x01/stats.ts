import type { X01PlayerState, X01ThrowRecord } from "@/lib/types";

export interface X01PlayerStats {
  ppr: number;
  first9Ppr: number;
  checkoutRate: string;
  visits60: number;
  visits100: number;
  visits140: number;
  visits180: number;
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

  // Checkout rate: successful checkouts / attempts at double
  // A checkout attempt is a visit where the player could have finished
  // Simplified: count visits where score was <= 170 at visit start (reachable in 3 darts)
  // and the last visit if they checked out
  let checkoutAttempts = 0;
  let checkoutSuccesses = 0;
  let runningScore = targetScore;

  for (const visit of visits) {
    const busted = isBustedVisit(visit);
    const vScore = visitScore(visit);

    // A checkout attempt is when the remaining score was reachable (<=170 for double-out, <=180 for straight)
    if (runningScore <= 170) {
      checkoutAttempts++;
      if (runningScore === vScore && !busted) {
        checkoutSuccesses++;
      }
    }

    if (!busted) {
      runningScore -= vScore;
    }
  }

  const checkoutRate =
    checkoutAttempts > 0
      ? `${checkoutSuccesses}/${checkoutAttempts}`
      : "—";

  // Visit score thresholds (non-busted visits only)
  let visits60 = 0;
  let visits100 = 0;
  let visits140 = 0;
  let visits180 = 0;

  for (const visit of visits) {
    if (isBustedVisit(visit)) continue;
    const score = visitScore(visit);
    if (score >= 180) visits180++;
    else if (score >= 140) visits140++;
    else if (score >= 100) visits100++;
    else if (score >= 60) visits60++;
  }

  return {
    ppr,
    first9Ppr,
    checkoutRate,
    visits60,
    visits100,
    visits140,
    visits180,
    totalDarts,
  };
}
