#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const [, , jsonPathArg] = process.argv
const dbPath = process.env.LEADERBOARD_DB_PATH || '/var/www/henry_games_api/data/leaderboard.sqlite'
const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..')
const schemaPath = resolve(repoRoot, 'server/sqlite/leaderboard_schema.sql')

if (!jsonPathArg) {
  console.error('Usage: node scripts/import-local-scores-to-sqlite.mjs <local-scores.json>')
  process.exit(1)
}

if (!existsSync(jsonPathArg)) {
  console.error(`Local score JSON file not found: ${jsonPathArg}`)
  process.exit(1)
}

if (!existsSync(schemaPath)) {
  console.error(`Schema file not found: ${schemaPath}`)
  process.exit(1)
}

const sqliteCheck = spawnSync('sqlite3', ['--version'], { encoding: 'utf8' })
if (sqliteCheck.status !== 0) {
  console.error('sqlite3 is required. Install it with: sudo apt install -y sqlite3')
  process.exit(1)
}

function parseScores(filePath) {
  const rawValue = readFileSync(filePath, 'utf8').trim()
  if (!rawValue) {
    return {}
  }

  const parsed = JSON.parse(rawValue)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Local score JSON must be an object.')
  }

  return parsed
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function sqlInteger(value, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? String(Math.trunc(numberValue)) : String(fallback)
}

function sqlNumber(value, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? String(numberValue) : String(fallback)
}

function buildChallengeSql(gameId, score) {
  const maxLevel = Number(score?.bestLevel ?? 0)
  if (!Number.isFinite(maxLevel) || maxLevel <= 0) {
    return ''
  }

  return `
INSERT INTO challenge_leaderboard (username, game_type, max_level)
VALUES ('', ${sqlString(gameId)}, ${sqlInteger(maxLevel)})
ON CONFLICT(game_type) DO UPDATE SET
  max_level = CASE
    WHEN excluded.max_level > challenge_leaderboard.max_level
    THEN excluded.max_level
    ELSE challenge_leaderboard.max_level
  END,
  updated_at = CASE
    WHEN excluded.max_level > challenge_leaderboard.max_level
    THEN CURRENT_TIMESTAMP
    ELSE challenge_leaderboard.updated_at
  END;
`
}

function buildFixedSql(gameId, score) {
  const byQuestionCount = score?.practiceBestAccuracyByQuestionCount
  if (!byQuestionCount || typeof byQuestionCount !== 'object' || Array.isArray(byQuestionCount)) {
    return ''
  }

  const statements = []
  for (const [questionCountKey, byLevel] of Object.entries(byQuestionCount)) {
    const questionCount = Number(questionCountKey)
    if (!Number.isInteger(questionCount) || questionCount <= 0) {
      continue
    }

    if (!byLevel || typeof byLevel !== 'object' || Array.isArray(byLevel)) {
      continue
    }

    for (const [levelKey, accuracyValue] of Object.entries(byLevel)) {
      const difficulty = Number(levelKey)
      const accuracy = Number(accuracyValue)
      if (!Number.isInteger(difficulty) || difficulty <= 0 || !Number.isFinite(accuracy)) {
        continue
      }

      const normalizedAccuracy = Math.max(0, Math.min(100, accuracy))
      const correctCount = Math.round((normalizedAccuracy / 100) * questionCount)

      statements.push(`
INSERT INTO fixed_leaderboard
  (username, game_type, difficulty, question_count, best_accuracy, correct_count, total_count)
VALUES
  ('', ${sqlString(gameId)}, ${sqlInteger(difficulty)}, ${sqlInteger(questionCount)}, ${sqlNumber(normalizedAccuracy)}, ${sqlInteger(correctCount)}, ${sqlInteger(questionCount)})
ON CONFLICT(game_type, difficulty, question_count) DO UPDATE SET
  best_accuracy = CASE
    WHEN excluded.best_accuracy > fixed_leaderboard.best_accuracy
    THEN excluded.best_accuracy
    ELSE fixed_leaderboard.best_accuracy
  END,
  correct_count = CASE
    WHEN excluded.best_accuracy > fixed_leaderboard.best_accuracy
    THEN excluded.correct_count
    ELSE fixed_leaderboard.correct_count
  END,
  total_count = CASE
    WHEN excluded.best_accuracy > fixed_leaderboard.best_accuracy
    THEN excluded.total_count
    ELSE fixed_leaderboard.total_count
  END,
  updated_at = CASE
    WHEN excluded.best_accuracy > fixed_leaderboard.best_accuracy
    THEN CURRENT_TIMESTAMP
    ELSE fixed_leaderboard.updated_at
  END;
`)
    }
  }

  return statements.join('\n')
}

try {
  const scores = parseScores(jsonPathArg)
  const statements = []

  for (const [gameId, score] of Object.entries(scores)) {
    statements.push(buildChallengeSql(gameId, score))
    statements.push(buildFixedSql(gameId, score))
  }

  const sql = `
.read ${schemaPath}
BEGIN TRANSACTION;
${statements.filter(Boolean).join('\n')}
COMMIT;
`

  const result = spawnSync('sqlite3', [dbPath], {
    input: sql,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout)
    process.exit(result.status ?? 1)
  }

  console.log(`Local scores imported into: ${dbPath}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
