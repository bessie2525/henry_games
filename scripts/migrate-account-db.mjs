#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dbPath = process.env.LEADERBOARD_DB_PATH || '/var/www/henry_games_api/data/leaderboard.sqlite'
const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..')
const schemaPath = resolve(repoRoot, 'server/sqlite/leaderboard_schema.sql')
const requireFromServer = createRequire(resolve(repoRoot, 'server/package.json'))
const Database = requireFromServer('better-sqlite3')

if (!existsSync(schemaPath)) {
  console.error(`Schema file not found: ${schemaPath}`)
  process.exit(1)
}

const db = new Database(dbPath)

function tableExists(tableName) {
  return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName))
}

function tableColumns(tableName) {
  if (!tableExists(tableName)) {
    return []
  }

  return db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name)
}

function migrateChallengeLeaderboard() {
  const columns = tableColumns('challenge_leaderboard')
  if (!columns.length || columns.includes('user_id')) {
    return
  }

  db.exec(`
    ALTER TABLE challenge_leaderboard RENAME TO challenge_leaderboard_legacy;

    CREATE TABLE challenge_leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT NOT NULL DEFAULT '',
      game_type TEXT NOT NULL,
      max_level INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, game_type),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    INSERT INTO challenge_leaderboard
      (id, user_id, username, game_type, max_level, created_at, updated_at)
    SELECT
      id,
      NULL,
      username,
      game_type,
      max_level,
      created_at,
      updated_at
    FROM challenge_leaderboard_legacy;

    DROP TABLE challenge_leaderboard_legacy;
  `)
}

function migrateFixedLeaderboard() {
  const columns = tableColumns('fixed_leaderboard')
  if (!columns.length || columns.includes('user_id')) {
    return
  }

  db.exec(`
    ALTER TABLE fixed_leaderboard RENAME TO fixed_leaderboard_legacy;

    CREATE TABLE fixed_leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT NOT NULL DEFAULT '',
      game_type TEXT NOT NULL,
      difficulty INTEGER NOT NULL,
      question_count INTEGER NOT NULL,
      best_accuracy REAL NOT NULL,
      correct_count INTEGER NOT NULL,
      total_count INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, game_type, difficulty, question_count),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    INSERT INTO fixed_leaderboard
      (id, user_id, username, game_type, difficulty, question_count, best_accuracy, correct_count, total_count, created_at, updated_at)
    SELECT
      id,
      NULL,
      username,
      game_type,
      difficulty,
      question_count,
      best_accuracy,
      correct_count,
      total_count,
      created_at,
      updated_at
    FROM fixed_leaderboard_legacy;

    DROP TABLE fixed_leaderboard_legacy;
  `)
}

function migrateUserRoles() {
  if (!tableExists('users')) {
    return
  }

  db.prepare("UPDATE users SET role = 'student' WHERE role IS NULL OR role = '' OR role = 'user'").run()
  db.prepare("UPDATE users SET role = 'admin', updated_at = CURRENT_TIMESTAMP WHERE lower(username) = 'bessie'").run()
  db.prepare("UPDATE users SET role = 'student', updated_at = CURRENT_TIMESTAMP WHERE lower(username) = 'henry'").run()
}

db.pragma('foreign_keys = OFF')

try {
  db.transaction(() => {
    db.exec(readFileSync(schemaPath, 'utf8'))
    migrateChallengeLeaderboard()
    migrateFixedLeaderboard()
    migrateUserRoles()
    db.exec(readFileSync(schemaPath, 'utf8'))
    migrateUserRoles()
  })()

  console.log(`Account database migration completed: ${dbPath}`)
} finally {
  db.pragma('foreign_keys = ON')
  db.close()
}
