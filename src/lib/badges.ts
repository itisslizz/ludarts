import type { PlayerDetailStats } from "./stats-store";

export type BadgeCategory = "milestones" | "skill" | "scoring" | "checkout" | "ranking" | "streaks";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  earned: boolean;
}

export const BADGE_DEFS: Omit<Badge, "earned">[] = [
  // Milestones
  { id: "first-dart",      name: "First Dart",      description: "Play your first leg",     icon: "🎯", category: "milestones" },
  { id: "getting-started", name: "Getting Started",  description: "Play 10 legs",            icon: "🎯", category: "milestones" },
  { id: "regular",         name: "Regular",          description: "Play 50 legs",            icon: "🎯", category: "milestones" },
  { id: "centurion",       name: "Centurion",        description: "Play 100 legs",           icon: "🏅", category: "milestones" },
  { id: "veteran",         name: "Veteran",          description: "Play 500 legs",           icon: "🏆", category: "milestones" },
  { id: "night-owl",       name: "Night Owl",        description: "Play a game after 11 pm", icon: "🦉", category: "milestones" },

  // Skill / PPR
  { id: "sharp-eye",       name: "Sharp Eye",        description: "Reach a PPR of 40+",           icon: "👁️", category: "skill" },
  { id: "club-player",     name: "Club Player",      description: "Reach a PPR of 60+",           icon: "📈", category: "skill" },
  { id: "county-standard", name: "County Standard",  description: "Reach a PPR of 80+",           icon: "📈", category: "skill" },
  { id: "tour-card",       name: "Tour Card",        description: "Reach a PPR of 100+",          icon: "💫", category: "skill" },
  { id: "world-class",     name: "World Class",      description: "Reach a PPR of 120+",          icon: "⭐", category: "skill" },
  { id: "hot-start",       name: "Hot Start",        description: "First 9 PPR of 60+",           icon: "🚀", category: "skill" },
  { id: "blazing-start",   name: "Blazing Start",    description: "First 9 PPR of 80+",           icon: "🚀", category: "skill" },
  { id: "perfect-opening", name: "Perfect Opening",  description: "First 9 PPR of 100+",          icon: "🌟", category: "skill" },
  { id: "elite-scorer",    name: "Elite Scorer",     description: "Scoring PPR of 100+",          icon: "📐", category: "skill" },

  // Scoring
  { id: "ton",             name: "Ton!",             description: "Hit a 100+ visit",             icon: "💯", category: "scoring" },
  { id: "ton-forty",       name: "Ton Forty",        description: "Hit a 140+ visit",             icon: "🔥", category: "scoring" },
  { id: "maximum",         name: "Maximum!",         description: "Hit a 180",                    icon: "💥", category: "scoring" },
  { id: "machine",         name: "180 Machine",      description: "Hit 10 lifetime 180s",         icon: "🤖", category: "scoring" },
  { id: "high-finish",     name: "High Finish",      description: "Score 170+ in a single visit", icon: "⚡", category: "scoring" },
  { id: "perfection",       name: "Perfection",        description: "Hit a perfect 180 visit",           icon: "✨", category: "scoring" },
  { id: "washmachine",      name: "Washmachine",       description: "Score 26 (20, 5, 1) in 10 visits",  icon: "🧺", category: "scoring" },
  { id: "elite-washmachine",name: "Elite Washmachine", description: "Score 26 (20, 5, 1) in 100 visits", icon: "🌀", category: "scoring" },

  // Checkout
  { id: "on-the-board",      name: "On the Board",      description: "Complete your first double",            icon: "✅", category: "checkout" },
  { id: "checkout-artist",   name: "Checkout Artist",   description: "Achieve 40%+ checkout rate",            icon: "🎨", category: "checkout" },
  { id: "sharpshooter",      name: "Sharpshooter",      description: "Achieve 50%+ checkout rate",            icon: "🎯", category: "checkout" },
  { id: "bull-finish",       name: "Bull Finish",       description: "Check out on the bull",                 icon: "🐂", category: "checkout" },
  { id: "double-collection", name: "Double Collection", description: "Successfully hit 10+ different doubles", icon: "🎰", category: "checkout" },

  // Streaks / Win Rate
  { id: "first-win",  name: "First Win",  description: "Win your first leg",        icon: "🏆", category: "streaks" },
  { id: "consistent", name: "Consistent", description: "Achieve 60%+ win rate",    icon: "📊", category: "streaks" },
  { id: "dominant",   name: "Dominant",   description: "Achieve 70%+ win rate",    icon: "👑", category: "streaks" },
  { id: "on-fire",    name: "On Fire",    description: "Win 3 legs in a row",      icon: "🔥", category: "streaks" },
  { id: "hot-streak", name: "Hot Streak", description: "Win 5 legs in a row",      icon: "🌋", category: "streaks" },

  // ELO Ranking
  { id: "rising-star",  name: "Rising Star",  description: "Reach an ELO of 1600", icon: "⬆️", category: "ranking" },
  { id: "established",  name: "Established",  description: "Reach an ELO of 1700", icon: "🥈", category: "ranking" },
  { id: "elite",        name: "Elite",        description: "Reach an ELO of 1800", icon: "🥇", category: "ranking" },
  { id: "grand-master", name: "Grand Master", description: "Reach an ELO of 2000", icon: "👑", category: "ranking" },
];

function maxConsecutiveWins(games: Array<{ won: boolean }>): number {
  let max = 0;
  let current = 0;
  for (const g of games) {
    if (g.won) { current++; max = Math.max(max, current); }
    else current = 0;
  }
  return max;
}

export function computeBadges(stats: PlayerDetailStats, eloRating: number): Badge[] {
  const { legsPlayed, ppr, first9Ppr, scoringPpr, winRate, tons, ton40s, ton80s, highestVisit, checkoutRate, checkoutDetails, recentGames, washmachineCount } = stats;

  const streak = maxConsecutiveWins(recentGames);
  const bullDetail = checkoutDetails.find((d) => d.segment === "D-Bull");
  const doublesHit = checkoutDetails.filter((d) => d.made > 0).length;
  const hasNightGame = recentGames.some((g) => {
    const hour = new Date(g.startedAt).getHours();
    return hour >= 23 || hour <= 3;
  });

  const earnedSet = new Set<string>();

  // Milestones
  if (legsPlayed >= 1) earnedSet.add("first-dart");
  if (legsPlayed >= 10) earnedSet.add("getting-started");
  if (legsPlayed >= 50) earnedSet.add("regular");
  if (legsPlayed >= 100) earnedSet.add("centurion");
  if (legsPlayed >= 500) earnedSet.add("veteran");
  if (hasNightGame) earnedSet.add("night-owl");

  // Skill
  if (ppr != null && ppr >= 40) earnedSet.add("sharp-eye");
  if (ppr != null && ppr >= 60) earnedSet.add("club-player");
  if (ppr != null && ppr >= 80) earnedSet.add("county-standard");
  if (ppr != null && ppr >= 100) earnedSet.add("tour-card");
  if (ppr != null && ppr >= 120) earnedSet.add("world-class");
  if (first9Ppr != null && first9Ppr >= 60) earnedSet.add("hot-start");
  if (first9Ppr != null && first9Ppr >= 80) earnedSet.add("blazing-start");
  if (first9Ppr != null && first9Ppr >= 100) earnedSet.add("perfect-opening");
  if (scoringPpr != null && scoringPpr >= 100) earnedSet.add("elite-scorer");

  // Scoring
  if (tons > 0) earnedSet.add("ton");
  if (ton40s > 0) earnedSet.add("ton-forty");
  if (ton80s > 0) earnedSet.add("maximum");
  if (ton80s >= 10) earnedSet.add("machine");
  if (highestVisit != null && highestVisit >= 170) earnedSet.add("high-finish");
  if (highestVisit === 180) earnedSet.add("perfection");
  if (washmachineCount >= 10)  earnedSet.add("washmachine");
  if (washmachineCount >= 100) earnedSet.add("elite-washmachine");

  // Checkout (checkoutRate is 0-100)
  if (checkoutRate != null && checkoutRate > 0) earnedSet.add("on-the-board");
  if (checkoutRate != null && checkoutRate >= 40) earnedSet.add("checkout-artist");
  if (checkoutRate != null && checkoutRate >= 50) earnedSet.add("sharpshooter");
  if (bullDetail && bullDetail.made > 0) earnedSet.add("bull-finish");
  if (doublesHit >= 10) earnedSet.add("double-collection");

  // Streaks (winRate is 0-100)
  if (winRate != null && winRate > 0) earnedSet.add("first-win");
  if (winRate != null && winRate >= 60) earnedSet.add("consistent");
  if (winRate != null && winRate >= 70) earnedSet.add("dominant");
  if (streak >= 3) earnedSet.add("on-fire");
  if (streak >= 5) earnedSet.add("hot-streak");

  // ELO Ranking
  if (eloRating >= 1600) earnedSet.add("rising-star");
  if (eloRating >= 1700) earnedSet.add("established");
  if (eloRating >= 1800) earnedSet.add("elite");
  if (eloRating >= 2000) earnedSet.add("grand-master");

  return BADGE_DEFS.map((def) => ({ ...def, earned: earnedSet.has(def.id) }));
}

// Lightweight badge computation from basic player stats — used in the player list API
// to avoid expensive per-game queries. Only computes milestone, PPR, win rate, and ELO badges.
export function computeTopBadgesBasic(
  legsPlayed: number,
  ppr: number | null,
  winRate: number | null,
  eloRating: number,
): string[] {
  const earnedIds: string[] = [];

  if (legsPlayed >= 1) earnedIds.push("first-dart");
  if (legsPlayed >= 10) earnedIds.push("getting-started");
  if (legsPlayed >= 50) earnedIds.push("regular");
  if (legsPlayed >= 100) earnedIds.push("centurion");
  if (legsPlayed >= 500) earnedIds.push("veteran");

  if (ppr != null && ppr >= 40) earnedIds.push("sharp-eye");
  if (ppr != null && ppr >= 60) earnedIds.push("club-player");
  if (ppr != null && ppr >= 80) earnedIds.push("county-standard");
  if (ppr != null && ppr >= 100) earnedIds.push("tour-card");
  if (ppr != null && ppr >= 120) earnedIds.push("world-class");

  if (winRate != null && winRate > 0) earnedIds.push("first-win");
  if (winRate != null && winRate >= 60) earnedIds.push("consistent");
  if (winRate != null && winRate >= 70) earnedIds.push("dominant");

  if (eloRating >= 1600) earnedIds.push("rising-star");
  if (eloRating >= 1700) earnedIds.push("established");
  if (eloRating >= 1800) earnedIds.push("elite");
  if (eloRating >= 2000) earnedIds.push("grand-master");

  // Return the 3 highest-tier badges for the player card display
  return earnedIds.slice(-3);
}
