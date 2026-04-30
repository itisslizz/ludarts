import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { StatsStore, PlayerDetailStats } from "./stats-store";
import type { DbPlayer, DbX01Game, DbX01Dart, DbX01GamePlayer } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "autodarts.db");

function getDb(): Database.Database {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      elo_rating  INTEGER NOT NULL DEFAULT 1500,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS x01_games (
      id            TEXT PRIMARY KEY,
      target_score  INTEGER NOT NULL,
      out_mode      TEXT NOT NULL,
      started_at    TEXT NOT NULL,
      finished_at   TEXT,
      winner_id     TEXT,
      FOREIGN KEY (winner_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS x01_game_players (
      game_id     TEXT NOT NULL,
      player_id   TEXT NOT NULL,
      position    INTEGER NOT NULL,
      elo_change  INTEGER,
      PRIMARY KEY (game_id, player_id),
      FOREIGN KEY (game_id) REFERENCES x01_games(id),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS x01_darts (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id             TEXT NOT NULL,
      player_id           TEXT NOT NULL,
      visit_number        INTEGER NOT NULL,
      dart_index          INTEGER NOT NULL,
      segment_name        TEXT NOT NULL,
      segment_number      INTEGER NOT NULL,
      segment_multiplier  INTEGER NOT NULL,
      score               INTEGER NOT NULL,
      is_bust             INTEGER NOT NULL,
      coord_x             REAL,
      coord_y             REAL,
      FOREIGN KEY (game_id) REFERENCES x01_games(id),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );
  `);
  
  // Add elo_rating column to existing tables if it doesn't exist
  try {
    db.exec(`ALTER TABLE players ADD COLUMN elo_rating INTEGER NOT NULL DEFAULT 1500`);
  } catch {
    // Column already exists
  }
  
  // Add elo_change column to x01_game_players if it doesn't exist
  try {
    db.exec(`ALTER TABLE x01_game_players ADD COLUMN elo_change INTEGER`);
  } catch {
    // Column already exists
  }
}

let _db: Database.Database | null = null;

function db(): Database.Database {
  if (!_db) _db = getDb();
  return _db;
}

/**
 * Calculate Elo rating changes for a 1v1 match
 * @param winnerRating - Current Elo rating of the winner
 * @param loserRating - Current Elo rating of the loser
 * @param kFactor - K-factor for rating change magnitude (default 32)
 * @returns Object with rating changes for winner and loser
 */
function calculateEloChanges(
  winnerRating: number,
  loserRating: number,
  kFactor: number = 32
): { winnerChange: number; loserChange: number } {
  // Expected score for winner
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  // Expected score for loser
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
  
  // Actual scores: 1 for win, 0 for loss
  const winnerChange = Math.round(kFactor * (1 - expectedWinner));
  const loserChange = Math.round(kFactor * (0 - expectedLoser));
  
  return { winnerChange, loserChange };
}

export const sqliteStatsStore: StatsStore = {
  // --- Players ---

  getPlayers() {
    return db().prepare("SELECT * FROM players ORDER BY name").all() as DbPlayer[];
  },

  getPlayer(id: string) {
    return db().prepare("SELECT * FROM players WHERE id = ?").get(id) as DbPlayer | undefined;
  },

  savePlayer(player: DbPlayer) {
    const eloRating = player.elo_rating ?? 1500;
    db()
      .prepare(
        "INSERT INTO players (id, name, elo_rating, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name",
      )
      .run(player.id, player.name, eloRating, player.created_at);
  },

  deletePlayer(id: string) {
    const d = db();
    const tx = d.transaction(() => {
      d.prepare("DELETE FROM x01_darts WHERE player_id = ?").run(id);
      d.prepare("DELETE FROM x01_game_players WHERE player_id = ?").run(id);
      d.prepare("UPDATE x01_games SET winner_id = NULL WHERE winner_id = ?").run(id);
      d.prepare(
        "DELETE FROM x01_games WHERE id NOT IN (SELECT DISTINCT game_id FROM x01_game_players)",
      ).run();
      d.prepare("DELETE FROM players WHERE id = ?").run(id);
    });
    tx();
  },

  // --- X01 Games ---

  saveX01Game(
    game: DbX01Game,
    players: DbX01GamePlayer[],
    darts: Omit<DbX01Dart, "id">[],
    eloEnabled: boolean = false,
  ) {
    const d = db();
    const insertGame = d.prepare(
      "INSERT INTO x01_games (id, target_score, out_mode, started_at, finished_at, winner_id) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const insertPlayer = d.prepare(
      "INSERT INTO x01_game_players (game_id, player_id, position, elo_change) VALUES (?, ?, ?, ?)",
    );
    const insertDart = d.prepare(
      `INSERT INTO x01_darts (game_id, player_id, visit_number, dart_index, segment_name, segment_number, segment_multiplier, score, is_bust, coord_x, coord_y)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const updateElo = d.prepare(
      "UPDATE players SET elo_rating = elo_rating + ? WHERE id = ?",
    );

    const tx = d.transaction(() => {
      insertGame.run(
        game.id,
        game.target_score,
        game.out_mode,
        game.started_at,
        game.finished_at,
        game.winner_id,
      );
      
      // Calculate Elo changes when Elo is enabled
      let eloChanges: Map<string, number> = new Map();
      if (eloEnabled && players.length >= 2 && game.winner_id) {
        const winnerPlayer = this.getPlayer(game.winner_id);
        const losers = players.filter(p => p.player_id !== game.winner_id);

        if (winnerPlayer && losers.length > 0) {
          const winnerRating = winnerPlayer.elo_rating ?? 1500;
          const N = losers.length;

          if (N === 1) {
            // Standard 1v1 Elo
            const loserPlayer = this.getPlayer(losers[0].player_id);
            if (loserPlayer) {
              const { winnerChange, loserChange } = calculateEloChanges(
                winnerRating,
                loserPlayer.elo_rating ?? 1500
              );
              eloChanges.set(game.winner_id, winnerChange);
              eloChanges.set(losers[0].player_id, loserChange);
            }
          } else {
            // Multiplayer: winner gains sum of (1v1 winnerChange / N) per loser
            // Each loser loses their share (same absolute value)
            let winnerTotal = 0;
            for (const loser of losers) {
              const loserPlayer = this.getPlayer(loser.player_id);
              if (loserPlayer) {
                const { winnerChange } = calculateEloChanges(
                  winnerRating,
                  loserPlayer.elo_rating ?? 1500
                );
                const share = Math.round(winnerChange / N);
                winnerTotal += share;
                eloChanges.set(loser.player_id, -share);
              }
            }
            eloChanges.set(game.winner_id, winnerTotal);
          }

          // Update all player ratings
          for (const [playerId, change] of eloChanges) {
            updateElo.run(change, playerId);
          }
        }
      }
      
      for (const p of players) {
        const eloChange = eloChanges.get(p.player_id) ?? null;
        insertPlayer.run(p.game_id, p.player_id, p.position, eloChange);
      }
      for (const dart of darts) {
        insertDart.run(
          dart.game_id,
          dart.player_id,
          dart.visit_number,
          dart.dart_index,
          dart.segment_name,
          dart.segment_number,
          dart.segment_multiplier,
          dart.score,
          dart.is_bust,
          dart.coord_x,
          dart.coord_y,
        );
      }
    });

    tx();
  },

  getX01GamePlayers(gameId: string): DbX01GamePlayer[] {
    return db()
      .prepare(
        "SELECT * FROM x01_game_players WHERE game_id = ?"
      )
      .all(gameId) as DbX01GamePlayer[];
  },

  getX01GamesForPlayer(playerId: string) {
    return db()
      .prepare(
        `SELECT g.* FROM x01_games g
         JOIN x01_game_players gp ON gp.game_id = g.id
         WHERE gp.player_id = ?
         ORDER BY g.started_at DESC`,
      )
      .all(playerId) as DbX01Game[];
  },

  getX01DartsForGame(gameId: string) {
    return db()
      .prepare(
        "SELECT * FROM x01_darts WHERE game_id = ? ORDER BY visit_number, dart_index",
      )
      .all(gameId) as DbX01Dart[];
  },

  getPlayerX01Stats(playerId: string) {
    const d = db();

    // PPR: Points Per Round (3 darts) - busted visits score 0 and count as 3 darts
    const pprRow = d
      .prepare(
        `SELECT
           SUM(CASE WHEN visit_bust = 0 THEN visit_score ELSE 0 END) * 3.0 / 
           SUM(CASE WHEN visit_bust = 1 THEN 3 ELSE darts_thrown END) AS ppr
         FROM (
           SELECT SUM(score) AS visit_score, MAX(is_bust) AS visit_bust, COUNT(*) AS darts_thrown
           FROM x01_darts
           WHERE player_id = ?
           GROUP BY game_id, visit_number
         )`,
      )
      .get(playerId) as { ppr: number | null } | undefined;

    // Win rate over last 100 finished multiplayer games (exclude single-player)
    const winRow = d
      .prepare(
        `SELECT
           COUNT(*) AS total,
           COUNT(CASE WHEN g.winner_id = ? THEN 1 END) AS wins
         FROM (
           SELECT g2.winner_id
           FROM x01_games g2
           JOIN x01_game_players gp ON gp.game_id = g2.id
           WHERE gp.player_id = ? AND g2.finished_at IS NOT NULL
             AND (SELECT COUNT(*) FROM x01_game_players WHERE game_id = g2.id) > 1
           ORDER BY g2.started_at DESC
           LIMIT 100
         ) g`,
      )
      .get(playerId, playerId) as { total: number; wins: number } | undefined;

    const legsPlayed = winRow?.total ?? 0;

    return {
      ppr: pprRow?.ppr ?? null,
      winRate: legsPlayed > 0 ? ((winRow!.wins / legsPlayed) * 100) : null,
      legsPlayed,
    };
  },

  getPlayerDetailStats(playerId: string, gameLimit?: number): PlayerDetailStats {
    const d = db();

    // When gameLimit is set, scope all queries to the most recent N games
    const gameFilter = gameLimit
      ? `AND game_id IN (
           SELECT g.id FROM x01_games g
           JOIN x01_game_players gp ON gp.game_id = g.id
           WHERE gp.player_id = ? AND g.finished_at IS NOT NULL
           ORDER BY g.started_at DESC LIMIT ${gameLimit}
         )`
      : "";
    // Extra bind param needed when gameFilter is active
    const dartParams = gameLimit ? [playerId, playerId] : [playerId];
    const gameFilterForGames = gameLimit
      ? `AND g.id IN (
           SELECT g2.id FROM x01_games g2
           JOIN x01_game_players gp2 ON gp2.game_id = g2.id
           WHERE gp2.player_id = ? AND g2.finished_at IS NOT NULL
           ORDER BY g2.started_at DESC LIMIT ${gameLimit}
         )`
      : "";
    // PPR: Points Per Round (3 darts) - busted visits score 0 and count as 3 darts
    const pprRow = d
      .prepare(
        `SELECT
           SUM(CASE WHEN visit_bust = 0 THEN visit_score ELSE 0 END) * 3.0 / 
           SUM(CASE WHEN visit_bust = 1 THEN 3 ELSE darts_thrown END) AS ppr
         FROM (
           SELECT SUM(score) AS visit_score, MAX(is_bust) AS visit_bust, COUNT(*) AS darts_thrown
           FROM x01_darts
           WHERE player_id = ? ${gameFilter}
           GROUP BY game_id, visit_number
         )`,
      )
      .get(...dartParams) as { ppr: number | null } | undefined;

    // Win rate (multiplayer games only)
    const winRow = d
      .prepare(
        `SELECT
           COUNT(*) AS total,
           COUNT(CASE WHEN g.winner_id = ? THEN 1 END) AS wins
         FROM (
           SELECT g2.winner_id
           FROM x01_games g2
           JOIN x01_game_players gp ON gp.game_id = g2.id
           WHERE gp.player_id = ? AND g2.finished_at IS NOT NULL
             AND (SELECT COUNT(*) FROM x01_game_players WHERE game_id = g2.id) > 1
           ORDER BY g2.started_at DESC
           ${gameLimit ? `LIMIT ${gameLimit}` : "LIMIT 100"}
         ) g`,
      )
      .get(playerId, playerId) as { total: number; wins: number } | undefined;

    const legsPlayed = winRow?.total ?? 0;

    // Total darts thrown
    const dartCountRow = d
      .prepare(`SELECT COUNT(*) AS cnt FROM x01_darts WHERE player_id = ? ${gameFilter}`)
      .get(...dartParams) as { cnt: number };

    // Highest non-bust visit score
    const highVisitRow = d
      .prepare(
        `SELECT MAX(visit_score) AS best FROM (
           SELECT SUM(score) AS visit_score, MAX(is_bust) AS visit_bust
           FROM x01_darts WHERE player_id = ? ${gameFilter}
           GROUP BY game_id, visit_number
         ) WHERE visit_bust = 0`,
      )
      .get(...dartParams) as { best: number | null } | undefined;

    // Visit score brackets: 100+, 140+, 180
    const bracketRow = d
      .prepare(
        `SELECT
           COUNT(CASE WHEN visit_score >= 100 THEN 1 END) AS tons,
           COUNT(CASE WHEN visit_score >= 140 THEN 1 END) AS ton40s,
           COUNT(CASE WHEN visit_score >= 180 THEN 1 END) AS ton80s
         FROM (
           SELECT SUM(score) AS visit_score, MAX(is_bust) AS visit_bust
           FROM x01_darts WHERE player_id = ? ${gameFilter}
           GROUP BY game_id, visit_number
         ) WHERE visit_bust = 0`,
      )
      .get(...dartParams) as { tons: number; ton40s: number; ton80s: number };

    // Washmachine count: visits with exactly S20 + S5 + S1 (any order), not busted
    const washmachineRow = d
      .prepare(
        `SELECT COUNT(*) AS washmachine_count
         FROM (
           SELECT
             game_id, visit_number,
             MAX(is_bust) AS visit_bust,
             COUNT(*) AS dart_count,
             SUM(CASE WHEN segment_number = 20 AND segment_multiplier = 1 THEN 1 ELSE 0 END) AS has_s20,
             SUM(CASE WHEN segment_number = 5  AND segment_multiplier = 1 THEN 1 ELSE 0 END) AS has_s5,
             SUM(CASE WHEN segment_number = 1  AND segment_multiplier = 1 THEN 1 ELSE 0 END) AS has_s1
           FROM x01_darts WHERE player_id = ? ${gameFilter}
           GROUP BY game_id, visit_number
         )
         WHERE visit_bust = 0
           AND dart_count = 3
           AND has_s20 = 1
           AND has_s5 = 1
           AND has_s1 = 1`,
      )
      .get(...dartParams) as { washmachine_count: number };

    // First 9 PPR (first 3 visits)
    const first9Row = d
      .prepare(
        `SELECT
           SUM(CASE WHEN visit_bust = 0 THEN visit_score ELSE 0 END) * 1.0 / NULLIF(COUNT(*), 0) AS ppr
         FROM (
           SELECT SUM(score) AS visit_score, MAX(is_bust) AS visit_bust
           FROM x01_darts
           WHERE player_id = ? ${gameFilter} AND visit_number <= 3
           GROUP BY game_id, visit_number
         )`,
      )
      .get(...dartParams) as { ppr: number | null } | undefined;

    // Recent games with per-game PPR
    const recentGames = d
      .prepare(
        `SELECT
           g.id, g.target_score, g.out_mode, g.started_at, g.winner_id,
           COALESCE(
             SUM(CASE WHEN d.is_bust = 0 THEN d.score ELSE 0 END) * 1.0 /
             NULLIF(COUNT(DISTINCT d.visit_number), 0),
             0
           ) AS ppr
         FROM x01_games g
         JOIN x01_game_players gp ON gp.game_id = g.id
         LEFT JOIN x01_darts d ON d.game_id = g.id AND d.player_id = gp.player_id
         WHERE gp.player_id = ? AND g.finished_at IS NOT NULL
         GROUP BY g.id
         ORDER BY g.started_at DESC
         LIMIT 20`,
      )
      .all(playerId) as { id: string; target_score: number; out_mode: string; started_at: string; winner_id: string | null; ppr: number }[];

    // All dart coordinates for heatmap
    const darts = d
      .prepare(
        `SELECT coord_x AS x, coord_y AS y FROM x01_darts WHERE player_id = ? ${gameFilter} AND coord_x IS NOT NULL AND coord_y IS NOT NULL`,
      )
      .all(...dartParams) as { x: number; y: number }[];

    // Per-double checkout details: reconstruct score at each dart to find attempts
    const checkoutMap = new Map<string, { made: number; attempts: number }>();
    let scoringVisitPoints = 0;
    let scoringVisitCount = 0;
    const pprHistory: { date: string; ppr: number; first9Ppr: number; scoringPpr: number | null }[] = [];
    const checkoutGameParams = gameLimit ? [playerId, playerId] : [playerId];
    const gameRows = d
      .prepare(
        `SELECT g.id, g.target_score, g.out_mode, g.winner_id, g.started_at
         FROM x01_games g
         JOIN x01_game_players gp ON gp.game_id = g.id
         WHERE gp.player_id = ? AND g.finished_at IS NOT NULL ${gameFilterForGames}
         ORDER BY g.started_at ASC`,
      )
      .all(...checkoutGameParams) as { id: string; target_score: number; out_mode: string; winner_id: string | null; started_at: string }[];

    for (const game of gameRows) {
      const gameDarts = d
        .prepare(
          `SELECT score, is_bust, segment_multiplier, segment_number, visit_number
           FROM x01_darts
           WHERE game_id = ? AND player_id = ?
           ORDER BY visit_number, dart_index`,
        )
        .all(game.id, playerId) as { score: number; is_bust: number; segment_multiplier: number; segment_number: number; visit_number: number }[];

      let remaining = game.target_score;
      let visitStart = remaining;
      let currentVisit = 0;
      let visitScore = 0;
      let visitBusted = false;

      // Per-game tracking
      let gameVisitCount = 0;
      let gameVisitPoints = 0;
      let gameFirst9Points = 0;
      let gameFirst9Visits = 0;
      let gameScoringPoints = 0;
      let gameScoringVisits = 0;

      function flushVisit() {
        if (currentVisit === 0) return;
        const pts = visitBusted ? 0 : visitScore;
        gameVisitCount++;
        gameVisitPoints += pts;
        if (currentVisit <= 3) {
          gameFirst9Visits++;
          gameFirst9Points += pts;
        }
        if (visitStart > 170) {
          gameScoringVisits++;
          gameScoringPoints += pts;
          scoringVisitCount++;
          scoringVisitPoints += pts;
        }
      }

      for (const dart of gameDarts) {
        if (dart.visit_number !== currentVisit) {
          flushVisit();
          currentVisit = dart.visit_number;
          visitStart = remaining;
          visitScore = 0;
          visitBusted = false;
        }

        visitScore += dart.score;
        if (dart.is_bust) visitBusted = true;

        // Check if remaining is a valid checkout (double-out)
        if (game.out_mode === "double" || game.out_mode === "Double Out") {
          const isCheckoutNum =
            (remaining >= 2 && remaining <= 40 && remaining % 2 === 0) ||
            remaining === 50;

          if (isCheckoutNum) {
            const targetDouble = remaining === 50 ? "D-Bull" : `D${remaining / 2}`;
            const entry = checkoutMap.get(targetDouble) ?? { made: 0, attempts: 0 };
            entry.attempts++;
            if (dart.segment_multiplier === 2 && dart.score === remaining) {
              entry.made++;
            }
            checkoutMap.set(targetDouble, entry);
          }
        }

        if (dart.is_bust) {
          remaining = visitStart;
        } else {
          remaining -= dart.score;
        }
      }

      flushVisit();

      if (gameVisitCount > 0) {
        pprHistory.push({
          date: game.started_at,
          ppr: gameVisitPoints / gameVisitCount,
          first9Ppr: gameFirst9Visits > 0 ? gameFirst9Points / gameFirst9Visits : 0,
          scoringPpr: gameScoringVisits > 0 ? gameScoringPoints / gameScoringVisits : null,
        });
      }
    }

    const checkoutDetails = [...checkoutMap.entries()]
      .map(([segment, { made, attempts }]) => ({ segment, made, attempts }))
      .sort((a, b) => b.attempts - a.attempts);

    // Real checkout rate from per-dart attempts
    let totalCheckoutAttempts = 0;
    let totalCheckoutMade = 0;
    for (const entry of checkoutMap.values()) {
      totalCheckoutAttempts += entry.attempts;
      totalCheckoutMade += entry.made;
    }

    return {
      ppr: pprRow?.ppr ?? null,
      first9Ppr: first9Row?.ppr ?? null,
      scoringPpr: scoringVisitCount > 0 ? (scoringVisitPoints / scoringVisitCount) : null,
      winRate: legsPlayed > 0 ? ((winRow!.wins / legsPlayed) * 100) : null,
      legsPlayed,
      totalDarts: dartCountRow.cnt,
      highestVisit: highVisitRow?.best ?? null,
      checkoutRate: totalCheckoutAttempts > 0
        ? ((totalCheckoutMade / totalCheckoutAttempts) * 100)
        : null,
      tons: bracketRow.tons,
      ton40s: bracketRow.ton40s,
      ton80s: bracketRow.ton80s,
      washmachineCount: washmachineRow.washmachine_count,
      checkoutDetails,
      pprHistory,
      recentGames: recentGames.map((g) => ({
        id: g.id,
        targetScore: g.target_score,
        outMode: g.out_mode,
        startedAt: g.started_at,
        won: g.winner_id === playerId,
        ppr: g.ppr,
      })),
      darts,
    };
  },

  clearAllStats() {
    const d = db();
    const tx = d.transaction(() => {
      d.prepare("DELETE FROM x01_darts").run();
      d.prepare("DELETE FROM x01_game_players").run();
      d.prepare("DELETE FROM x01_games").run();
    });
    tx();
  },
};
