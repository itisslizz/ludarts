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
}

let _db: Database.Database | null = null;

function db(): Database.Database {
  if (!_db) _db = getDb();
  return _db;
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
    db()
      .prepare(
        "INSERT INTO players (id, name, created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name",
      )
      .run(player.id, player.name, player.created_at);
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
  ) {
    const d = db();
    const insertGame = d.prepare(
      "INSERT INTO x01_games (id, target_score, out_mode, started_at, finished_at, winner_id) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const insertPlayer = d.prepare(
      "INSERT INTO x01_game_players (game_id, player_id, position) VALUES (?, ?, ?)",
    );
    const insertDart = d.prepare(
      `INSERT INTO x01_darts (game_id, player_id, visit_number, dart_index, segment_name, segment_number, segment_multiplier, score, is_bust, coord_x, coord_y)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      for (const p of players) {
        insertPlayer.run(p.game_id, p.player_id, p.position);
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

    // PPR: average points per visit (busted visits score 0)
    const pprRow = d
      .prepare(
        `SELECT
           SUM(CASE WHEN visit_bust = 0 THEN visit_score ELSE 0 END) * 1.0 / COUNT(*) AS ppr
         FROM (
           SELECT SUM(score) AS visit_score, MAX(is_bust) AS visit_bust
           FROM x01_darts
           WHERE player_id = ?
           GROUP BY game_id, visit_number
         )`,
      )
      .get(playerId) as { ppr: number | null } | undefined;

    // Win rate over last 100 finished games
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
           ORDER BY g2.started_at DESC
           LIMIT 100
         ) g`,
      )
      .get(playerId, playerId) as { total: number; wins: number } | undefined;

    const gamesPlayed = winRow?.total ?? 0;

    return {
      ppr: pprRow?.ppr ?? null,
      winRate: gamesPlayed > 0 ? ((winRow!.wins / gamesPlayed) * 100) : null,
      gamesPlayed,
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
    // PPR: average points per visit (busted visits score 0)
    const pprRow = d
      .prepare(
        `SELECT
           SUM(CASE WHEN visit_bust = 0 THEN visit_score ELSE 0 END) * 1.0 / COUNT(*) AS ppr
         FROM (
           SELECT SUM(score) AS visit_score, MAX(is_bust) AS visit_bust
           FROM x01_darts
           WHERE player_id = ? ${gameFilter}
           GROUP BY game_id, visit_number
         )`,
      )
      .get(...dartParams) as { ppr: number | null } | undefined;

    // Win rate
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
           ORDER BY g2.started_at DESC
           ${gameLimit ? `LIMIT ${gameLimit}` : "LIMIT 100"}
         ) g`,
      )
      .get(playerId, playerId) as { total: number; wins: number } | undefined;

    const gamesPlayed = winRow?.total ?? 0;

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
      winRate: gamesPlayed > 0 ? ((winRow!.wins / gamesPlayed) * 100) : null,
      gamesPlayed,
      totalDarts: dartCountRow.cnt,
      highestVisit: highVisitRow?.best ?? null,
      checkoutRate: totalCheckoutAttempts > 0
        ? ((totalCheckoutMade / totalCheckoutAttempts) * 100)
        : null,
      tons: bracketRow.tons,
      ton40s: bracketRow.ton40s,
      ton80s: bracketRow.ton80s,
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

  clearPlayerStats(playerId: string) {
    const d = db();
    const tx = d.transaction(() => {
      d.prepare("DELETE FROM x01_darts WHERE player_id = ?").run(playerId);
      d.prepare("DELETE FROM x01_game_players WHERE player_id = ?").run(playerId);
      // Remove games where this player was the only participant
      d.prepare(
        `DELETE FROM x01_games WHERE id NOT IN (SELECT DISTINCT game_id FROM x01_game_players)`,
      ).run();
    });
    tx();
  },
};
