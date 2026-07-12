const path = require('node:path')
const express = require('express')
const cors = require('cors')
const Database = require('better-sqlite3')

const app = express()
const port = Number(process.env.PORT || 3001)
const host = process.env.HOST || '127.0.0.1'
const dbPath = process.env.LEADERBOARD_DB_PATH || '/var/www/henry_games_api/data/leaderboard.sqlite'
const schemaPath = path.join(__dirname, 'sqlite', 'leaderboard_schema.sql')
const db = new Database(dbPath)

app.use(cors())
app.use(express.json({ limit: '32kb' }))

db.exec(require('node:fs').readFileSync(schemaPath, 'utf8'))

function isValidGameType(value) {
  return typeof value === 'string' && /^[a-z0-9-]+$/.test(value)
}

function toInteger(value) {
  return Number.isInteger(value) ? value : Number.NaN
}

app.get('/api/leaderboard/challenge', (_req, res) => {
  const rows = db
    .prepare(
      `
      SELECT
        username,
        game_type AS gameType,
        max_level AS maxLevel,
        updated_at AS updatedAt
      FROM challenge_leaderboard
      ORDER BY game_type ASC
    `,
    )
    .all()

  res.json(rows)
})

app.post('/api/leaderboard/challenge', (req, res) => {
  const gameType = req.body?.gameType
  const maxLevel = toInteger(req.body?.maxLevel)

  if (!isValidGameType(gameType) || !Number.isInteger(maxLevel) || maxLevel < 0 || maxLevel > 1000) {
    return res.status(400).json({ error: 'Invalid challenge score' })
  }

  db.prepare(
    `
    INSERT INTO challenge_leaderboard (username, game_type, max_level)
    VALUES ('', ?, ?)
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
      END
  `,
  ).run(gameType, maxLevel)

  res.json({ ok: true })
})

app.get('/api/leaderboard/fixed', (req, res) => {
  const { gameType, questionCount } = req.query
  const rows = db
    .prepare(
      `
      SELECT
        username,
        game_type AS gameType,
        difficulty,
        question_count AS questionCount,
        best_accuracy AS bestAccuracy,
        correct_count AS correctCount,
        total_count AS totalCount,
        updated_at AS updatedAt
      FROM fixed_leaderboard
      WHERE (? IS NULL OR game_type = ?)
        AND (? IS NULL OR question_count = ?)
      ORDER BY game_type ASC, question_count ASC, difficulty ASC
    `,
    )
    .all(gameType || null, gameType || null, questionCount || null, questionCount || null)

  res.json(rows)
})

app.post('/api/leaderboard/fixed', (req, res) => {
  const gameType = req.body?.gameType
  const difficulty = toInteger(req.body?.difficulty)
  const questionCount = toInteger(req.body?.questionCount)
  const accuracy = Number(req.body?.accuracy)
  const correctCount = toInteger(req.body?.correctCount)
  const totalCount = toInteger(req.body?.totalCount)

  if (
    !isValidGameType(gameType) ||
    !Number.isInteger(difficulty) ||
    !Number.isInteger(questionCount) ||
    !Number.isFinite(accuracy) ||
    !Number.isInteger(correctCount) ||
    !Number.isInteger(totalCount) ||
    difficulty <= 0 ||
    questionCount <= 0 ||
    totalCount <= 0 ||
    correctCount < 0 ||
    correctCount > totalCount ||
    accuracy < 0 ||
    accuracy > 100
  ) {
    return res.status(400).json({ error: 'Invalid fixed score' })
  }

  db.prepare(
    `
    INSERT INTO fixed_leaderboard
      (username, game_type, difficulty, question_count, best_accuracy, correct_count, total_count)
    VALUES ('', ?, ?, ?, ?, ?, ?)
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
      END
  `,
  ).run(gameType, difficulty, questionCount, accuracy, correctCount, totalCount)

  res.json({ ok: true })
})

app.listen(port, host, () => {
  console.log(`Leaderboard API running on http://${host}:${port}`)
  console.log(`SQLite database: ${dbPath}`)
})
