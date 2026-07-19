const path = require('node:path')
const express = require('express')
const cors = require('cors')
const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()
const port = Number(process.env.PORT || 3001)
const host = process.env.HOST || '127.0.0.1'
const dbPath = process.env.LEADERBOARD_DB_PATH || '/var/www/henry_games_api/data/leaderboard.sqlite'
const schemaPath = path.join(__dirname, 'sqlite', 'leaderboard_schema.sql')
const jwtSecret = process.env.JWT_SECRET || 'henry-games-dev-secret-change-me'
const tokenExpiresIn = process.env.JWT_EXPIRES_IN || '7d'
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

function normalizeUsername(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidUsername(value) {
  return /^[\p{L}\p{N}_]{2,20}$/u.test(value)
}

function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 6 && value.length <= 72
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
  }
}

function signUserToken(user) {
  return jwt.sign({ sub: String(user.id), username: user.username, role: user.role }, jwtSecret, {
    expiresIn: tokenExpiresIn,
  })
}

function getBearerToken(req) {
  const header = req.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? ''
}

function getAuthenticatedUser(req) {
  const token = getBearerToken(req)
  if (!token) {
    return null
  }

  try {
    const payload = jwt.verify(token, jwtSecret)
    const userId = Number(payload.sub)
    if (!Number.isInteger(userId)) {
      return null
    }

    return db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(userId) ?? null
  } catch {
    return null
  }
}

function requireAuth(req, res, next) {
  const user = getAuthenticatedUser(req)
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  req.user = user
  return next()
}

const authAttempts = new Map()

function authRateLimit(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const windowMs = 60 * 1000
  const maxAttempts = 20
  const attempts = (authAttempts.get(key) || []).filter((timestamp) => now - timestamp < windowMs)

  if (attempts.length >= maxAttempts) {
    return res.status(429).json({ error: 'Too many requests' })
  }

  attempts.push(now)
  authAttempts.set(key, attempts)
  return next()
}

app.post('/api/auth/register', authRateLimit, (req, res) => {
  const username = normalizeUsername(req.body?.username)
  const password = req.body?.password

  if (!isValidUsername(username) || !isValidPassword(password)) {
    return res.status(400).json({ error: 'Invalid username or password' })
  }

  const passwordHash = bcrypt.hashSync(password, 12)

  try {
    const result = db
      .prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
      .run(username, passwordHash, 'student')
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(result.lastInsertRowid)

    res.json({
      ok: true,
      user: publicUser(user),
      token: signUserToken(user),
    })
  } catch (error) {
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Username already exists' })
    }

    throw error
  }
})

app.post('/api/auth/login', authRateLimit, (req, res) => {
  const username = normalizeUsername(req.body?.username)
  const password = req.body?.password

  if (!username || !isValidPassword(password)) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  const user = db.prepare('SELECT id, username, password_hash, role FROM users WHERE username = ?').get(username)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  res.json({
    ok: true,
    user: publicUser(user),
    token: signUserToken(user),
  })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(publicUser(req.user))
})

app.patch('/api/auth/me', requireAuth, (req, res) => {
  const username = normalizeUsername(req.body?.username)

  if (!isValidUsername(username)) {
    return res.status(400).json({ error: 'Invalid username' })
  }

  try {
    db.transaction(() => {
      db.prepare('UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(username, req.user.id)
      db.prepare('UPDATE challenge_leaderboard SET username = ? WHERE user_id = ?').run(username, req.user.id)
      db.prepare('UPDATE fixed_leaderboard SET username = ? WHERE user_id = ?').run(username, req.user.id)
    })()

    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(req.user.id)
    res.json({
      ok: true,
      user: publicUser(user),
      token: signUserToken(user),
    })
  } catch (error) {
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Username already exists' })
    }

    throw error
  }
})

app.get('/api/leaderboard/challenge', (_req, res) => {
  const rows = db
    .prepare(
      `
      SELECT
        user_id AS userId,
        username,
        game_type AS gameType,
        max_level AS maxLevel,
        updated_at AS updatedAt
      FROM (
        SELECT
          user_id,
          username,
          game_type,
          max_level,
          updated_at,
          ROW_NUMBER() OVER (
            PARTITION BY game_type
            ORDER BY max_level DESC, updated_at ASC, id ASC
          ) AS rank
        FROM challenge_leaderboard
      )
      WHERE rank = 1
      ORDER BY game_type ASC
    `,
    )
    .all()

  res.json(rows)
})

app.post('/api/leaderboard/challenge', requireAuth, (req, res) => {
  const gameType = req.body?.gameType
  const maxLevel = toInteger(req.body?.maxLevel)

  if (!isValidGameType(gameType) || !Number.isInteger(maxLevel) || maxLevel < 0 || maxLevel > 1000) {
    return res.status(400).json({ error: 'Invalid challenge score' })
  }

  db.prepare(
    `
    INSERT INTO challenge_leaderboard (user_id, username, game_type, max_level)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, game_type) DO UPDATE SET
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
  ).run(req.user.id, req.user.username, gameType, maxLevel)

  res.json({ ok: true })
})

app.get('/api/leaderboard/fixed', (req, res) => {
  const { gameType, questionCount } = req.query
  const rows = db
    .prepare(
      `
      SELECT
        user_id AS userId,
        username,
        game_type AS gameType,
        difficulty,
        question_count AS questionCount,
        best_accuracy AS bestAccuracy,
        correct_count AS correctCount,
        total_count AS totalCount,
        updated_at AS updatedAt
      FROM (
        SELECT
          user_id,
          username,
          game_type,
          difficulty,
          question_count,
          best_accuracy,
          correct_count,
          total_count,
          updated_at,
          ROW_NUMBER() OVER (
            PARTITION BY game_type, difficulty, question_count
            ORDER BY best_accuracy DESC, updated_at ASC, id ASC
          ) AS rank
        FROM fixed_leaderboard
        WHERE (? IS NULL OR game_type = ?)
          AND (? IS NULL OR question_count = ?)
      )
      WHERE rank = 1
      ORDER BY game_type ASC, question_count ASC, difficulty ASC
    `,
    )
    .all(gameType || null, gameType || null, questionCount || null, questionCount || null)

  res.json(rows)
})

app.post('/api/leaderboard/fixed', requireAuth, (req, res) => {
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
      (user_id, username, game_type, difficulty, question_count, best_accuracy, correct_count, total_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, game_type, difficulty, question_count) DO UPDATE SET
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
  ).run(req.user.id, req.user.username, gameType, difficulty, questionCount, accuracy, correctCount, totalCount)

  res.json({ ok: true })
})

app.listen(port, host, () => {
  console.log(`Leaderboard API running on http://${host}:${port}`)
  console.log(`SQLite database: ${dbPath}`)
})
