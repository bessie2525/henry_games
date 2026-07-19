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

const pointCategories = new Set(['math', 'english', 'english_challenge', 'reading', 'writing', 'housework', 'other'])
const wordChallengeStageCount = 5

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

function isAdmin(user) {
  return user?.role === 'admin'
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ error: 'Admin permission required' })
  }

  return next()
}

function isValidRecordDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

function normalizeText(value, maxLength = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function isValidPointCategory(value) {
  return typeof value === 'string' && pointCategories.has(value)
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeWordChallengeWords(value) {
  if (!Array.isArray(value)) {
    return null
  }

  const words = value.map((item) => ({
    word: normalizeText(item?.word, 40),
    phonetic: normalizeText(item?.phonetic, 40),
    meaning: normalizeText(item?.meaning, 80),
    example: normalizeText(item?.example, 180),
  }))

  if (
    words.length !== 10 ||
    words.some((item) => !item.word || !item.meaning || !item.example || !/^[A-Za-z][A-Za-z\s'-]*$/.test(item.word))
  ) {
    return null
  }

  return words
}

function publicWordChallengeWords(value) {
  return safeJsonParse(value, []).map((item) => ({
    word: normalizeText(item?.word, 40),
    phonetic: normalizeText(item?.phonetic, 40),
    meaning: normalizeText(item?.meaning, 80),
    example: normalizeText(item?.example, 180),
  }))
}

function publicWordChallengeTask(row, completedTaskIds = new Set()) {
  return {
    id: row.id,
    taskDate: row.task_date,
    title: row.title,
    words: publicWordChallengeWords(row.words_json),
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isCompleted: completedTaskIds.has(row.id),
  }
}

function getStudentById(userId) {
  if (!Number.isInteger(userId)) {
    return null
  }

  return db.prepare("SELECT id, username, role FROM users WHERE id = ? AND role = 'student'").get(userId) ?? null
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
      db.prepare('UPDATE student_point_records SET student_username = ? WHERE student_user_id = ?').run(username, req.user.id)
      db.prepare('UPDATE word_challenge_completions SET student_username = ? WHERE student_user_id = ?').run(username, req.user.id)
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

app.get('/api/points/students', requireAuth, requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `
      SELECT id, username
      FROM users
      WHERE role = 'student'
      ORDER BY username ASC
    `,
    )
    .all()

  res.json(rows)
})

app.post('/api/points/records', requireAuth, (req, res) => {
  const category = req.body?.category
  const stars = toInteger(req.body?.stars)
  const recordDate = req.body?.recordDate
  const detail = normalizeText(req.body?.detail, 100)
  const note = normalizeText(req.body?.note, 500)
  const requestedStudentUserId = toInteger(req.body?.studentUserId)

  if (
    !isValidPointCategory(category) ||
    !Number.isInteger(stars) ||
    stars < 0 ||
    stars > 100 ||
    !isValidRecordDate(recordDate) ||
    (category === 'other' && !detail)
  ) {
    return res.status(400).json({ error: 'Invalid point record' })
  }

  let student = null

  if (isAdmin(req.user)) {
    student = getStudentById(requestedStudentUserId)
    if (!student) {
      return res.status(400).json({ error: 'Invalid student' })
    }
  } else {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Student permission required' })
    }

    if (Number.isInteger(requestedStudentUserId) && requestedStudentUserId !== req.user.id) {
      return res.status(403).json({ error: 'Cannot create records for another student' })
    }

    student = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
    }
  }

  const result = db
    .prepare(
      `
      INSERT INTO student_point_records
        (student_user_id, student_username, category, stars, record_date, detail, note, created_by_user_id)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(student.id, student.username, category, stars, recordDate, detail, note, req.user.id)

  const record = db
    .prepare(
      `
      SELECT
        id,
        student_user_id AS studentUserId,
        student_username AS studentUsername,
        category,
        stars,
        record_date AS recordDate,
        detail,
        note,
        created_by_user_id AS createdByUserId,
        updated_by_user_id AS updatedByUserId,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM student_point_records
      WHERE id = ?
    `,
    )
    .get(result.lastInsertRowid)

  res.json({ ok: true, record })
})

app.get('/api/points/records', requireAuth, (req, res) => {
  const requestedStudentUserId = req.query.studentUserId ? Number(req.query.studentUserId) : null
  const from = typeof req.query.from === 'string' ? req.query.from : null
  const to = typeof req.query.to === 'string' ? req.query.to : null
  const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500)
  const where = []
  const params = []

  if (isAdmin(req.user)) {
    if (Number.isInteger(requestedStudentUserId)) {
      where.push('student_user_id = ?')
      params.push(requestedStudentUserId)
    }
  } else {
    where.push('student_user_id = ?')
    params.push(req.user.id)
  }

  if (from && isValidRecordDate(from)) {
    where.push('record_date >= ?')
    params.push(from)
  }

  if (to && isValidRecordDate(to)) {
    where.push('record_date <= ?')
    params.push(to)
  }

  const rows = db
    .prepare(
      `
      SELECT
        id,
        student_user_id AS studentUserId,
        student_username AS studentUsername,
        category,
        stars,
        record_date AS recordDate,
        detail,
        note,
        created_by_user_id AS createdByUserId,
        updated_by_user_id AS updatedByUserId,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM student_point_records
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY record_date DESC, created_at DESC, id DESC
      LIMIT ?
    `,
    )
    .all(...params, limit)

  res.json({ records: rows })
})

app.get('/api/points/summary', requireAuth, (req, res) => {
  const requestedStudentUserId = req.query.studentUserId ? Number(req.query.studentUserId) : null
  const from = typeof req.query.from === 'string' ? req.query.from : null
  const to = typeof req.query.to === 'string' ? req.query.to : null
  const where = []
  const params = []

  if (isAdmin(req.user)) {
    if (Number.isInteger(requestedStudentUserId)) {
      where.push('student_user_id = ?')
      params.push(requestedStudentUserId)
    }
  } else {
    where.push('student_user_id = ?')
    params.push(req.user.id)
  }

  if (from && isValidRecordDate(from)) {
    where.push('record_date >= ?')
    params.push(from)
  }

  if (to && isValidRecordDate(to)) {
    where.push('record_date <= ?')
    params.push(to)
  }

  const rows = db
    .prepare(
      `
      SELECT
        record_date AS recordDate,
        category,
        SUM(stars) AS stars
      FROM student_point_records
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      GROUP BY record_date, category
      ORDER BY record_date DESC
    `,
    )
    .all(...params)

  const summaryByDate = new Map()
  let totalStars = 0

  for (const row of rows) {
    if (!summaryByDate.has(row.recordDate)) {
      summaryByDate.set(row.recordDate, {
        recordDate: row.recordDate,
        byCategory: {
          math: 0,
          english: 0,
          english_challenge: 0,
          reading: 0,
          writing: 0,
          housework: 0,
          other: 0,
        },
        totalStars: 0,
      })
    }

    const summary = summaryByDate.get(row.recordDate)
    const stars = Number(row.stars) || 0
    summary.byCategory[row.category] = stars
    summary.totalStars += stars
    totalStars += stars
  }

  res.json({
    dailySummaries: Array.from(summaryByDate.values()),
    totalStars,
  })
})

app.patch('/api/points/records/:id', requireAuth, requireAdmin, (req, res) => {
  const recordId = Number(req.params.id)
  const category = req.body?.category
  const stars = toInteger(req.body?.stars)
  const detail = normalizeText(req.body?.detail, 100)
  const note = normalizeText(req.body?.note, 500)

  if (
    !Number.isInteger(recordId) ||
    !isValidPointCategory(category) ||
    !Number.isInteger(stars) ||
    stars < 0 ||
    stars > 100 ||
    (category === 'other' && !detail)
  ) {
    return res.status(400).json({ error: 'Invalid point record' })
  }

  const result = db
    .prepare(
      `
      UPDATE student_point_records
      SET
        category = ?,
        stars = ?,
        detail = ?,
        note = ?,
        updated_by_user_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    )
    .run(category, stars, detail, note, req.user.id, recordId)

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Point record not found' })
  }

  res.json({ ok: true })
})

app.get('/api/word-challenge/tasks', requireAuth, (req, res) => {
  const taskDate = typeof req.query.date === 'string' && isValidRecordDate(req.query.date) ? req.query.date : null
  const where = []
  const params = []

  if (taskDate) {
    where.push('task_date = ?')
    params.push(taskDate)
  }

  const tasks = db
    .prepare(
      `
      SELECT
        id,
        task_date,
        title,
        words_json,
        created_by_user_id,
        created_at,
        updated_at
      FROM word_challenge_tasks
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY task_date DESC, created_at DESC, id DESC
      LIMIT 60
    `,
    )
    .all(...params)

  const completedTaskIds = new Set()
  if (req.user.role === 'student' && tasks.length > 0) {
    const completionRows = db
      .prepare(
        `
        SELECT task_id AS taskId
        FROM word_challenge_completions
        WHERE student_user_id = ?
      `,
      )
      .all(req.user.id)

    for (const row of completionRows) {
      completedTaskIds.add(row.taskId)
    }
  }

  res.json({ tasks: tasks.map((task) => publicWordChallengeTask(task, completedTaskIds)) })
})

app.post('/api/word-challenge/tasks', requireAuth, requireAdmin, (req, res) => {
  const taskDate = req.body?.taskDate
  const title = normalizeText(req.body?.title, 80) || '每日英语单词闯关'
  const words = normalizeWordChallengeWords(req.body?.words)

  if (!isValidRecordDate(taskDate) || !words) {
    return res.status(400).json({ error: 'Invalid word challenge task' })
  }

  const result = db
    .prepare(
      `
      INSERT INTO word_challenge_tasks (task_date, title, words_json, created_by_user_id)
      VALUES (?, ?, ?, ?)
    `,
    )
    .run(taskDate, title, JSON.stringify(words), req.user.id)

  const task = db.prepare('SELECT * FROM word_challenge_tasks WHERE id = ?').get(result.lastInsertRowid)

  res.json({ ok: true, task: publicWordChallengeTask(task) })
})

app.patch('/api/word-challenge/tasks/:id', requireAuth, requireAdmin, (req, res) => {
  const taskId = Number(req.params.id)
  const taskDate = req.body?.taskDate
  const title = normalizeText(req.body?.title, 80) || '每日英语单词闯关'
  const words = normalizeWordChallengeWords(req.body?.words)

  if (!Number.isInteger(taskId) || !isValidRecordDate(taskDate) || !words) {
    return res.status(400).json({ error: 'Invalid word challenge task' })
  }

  const result = db
    .prepare(
      `
      UPDATE word_challenge_tasks
      SET task_date = ?, title = ?, words_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    )
    .run(taskDate, title, JSON.stringify(words), taskId)

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Word challenge task not found' })
  }

  const task = db.prepare('SELECT * FROM word_challenge_tasks WHERE id = ?').get(taskId)

  res.json({ ok: true, task: publicWordChallengeTask(task) })
})

app.post('/api/word-challenge/tasks/:id/complete', requireAuth, (req, res) => {
  const taskId = Number(req.params.id)
  const completedStages = toInteger(req.body?.completedStages)

  if (!Number.isInteger(taskId) || !Number.isInteger(completedStages) || completedStages < wordChallengeStageCount) {
    return res.status(400).json({ error: 'Invalid completion' })
  }

  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student permission required' })
  }

  const task = db.prepare('SELECT id, task_date, title FROM word_challenge_tasks WHERE id = ?').get(taskId)
  if (!task) {
    return res.status(404).json({ error: 'Word challenge task not found' })
  }

  const existing = db
    .prepare('SELECT id, point_record_id AS pointRecordId FROM word_challenge_completions WHERE task_id = ? AND student_user_id = ?')
    .get(taskId, req.user.id)

  if (existing) {
    return res.json({ ok: true, alreadyCompleted: true, pointRecordId: existing.pointRecordId })
  }

  const result = db.transaction(() => {
    const pointResult = db
      .prepare(
        `
        INSERT INTO student_point_records
          (student_user_id, student_username, category, stars, record_date, detail, note, created_by_user_id)
        VALUES
          (?, ?, 'english_challenge', 2, ?, ?, ?, ?)
      `,
      )
      .run(req.user.id, req.user.username, task.task_date, task.title, '完成英语单词闯关，系统自动加星', req.user.id)

    db.prepare(
      `
      INSERT INTO word_challenge_completions (task_id, student_user_id, student_username, point_record_id)
      VALUES (?, ?, ?, ?)
    `,
    ).run(taskId, req.user.id, req.user.username, pointResult.lastInsertRowid)

    return pointResult.lastInsertRowid
  })()

  res.json({ ok: true, alreadyCompleted: false, pointRecordId: result, awardedStars: 2 })
})

app.listen(port, host, () => {
  console.log(`Leaderboard API running on http://${host}:${port}`)
  console.log(`SQLite database: ${dbPath}`)
})
