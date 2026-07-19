#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3001/api'
const adminUsername = process.env.ADMIN_USERNAME
const adminPassword = process.env.ADMIN_PASSWORD
const adminToken = process.env.ADMIN_TOKEN

function printUsage() {
  console.log(`
Usage:
  ADMIN_USERNAME=bessie ADMIN_PASSWORD='your-password' node scripts/import-english-reading-task.mjs ./reading.csv
  ADMIN_TOKEN='jwt-token' node scripts/import-english-reading-task.mjs ./reading.json

Environment:
  API_BASE_URL       API base URL. Default: http://127.0.0.1:3001/api
  ADMIN_USERNAME    Admin username, used with ADMIN_PASSWORD
  ADMIN_PASSWORD    Admin password
  ADMIN_TOKEN       Optional existing admin JWT token

Input CSV columns:
  taskDate,title,level,summary,paragraphs,vocabulary,q1Prompt,q1Options,q1Answer,q1Explanation,q1Hint,q2Prompt,...

CSV field format:
  paragraphs   Separate paragraphs with ||
  vocabulary   word|phonetic|meaning|example;;word|phonetic|meaning|example
  qNOptions    Separate options with |

Example:
  taskDate,title,level,summary,paragraphs,vocabulary,q1Prompt,q1Options,q1Answer,q1Explanation,q1Hint
  2026-07-20,The Clever Fox,入门,A fox helps a friend.,A fox walked in the forest.||He saw a lost bird.,forest|/ˈfɔːrɪst/|森林|The forest is quiet.,Where did the fox walk?,In the forest|In the kitchen|In a car,In the forest,原文说 fox walked in the forest.,回到第 1 段找 forest。

Input JSON:
  {
    "taskDate": "2026-07-20",
    "title": "The Clever Fox",
    "level": "入门",
    "summary": "A fox helps a friend.",
    "paragraphs": ["A fox walked in the forest.", "He saw a lost bird."],
    "vocabulary": [
      { "word": "forest", "phonetic": "/ˈfɔːrɪst/", "meaning": "森林", "example": "The forest is quiet." }
    ],
    "questions": [
      {
        "id": "q1",
        "prompt": "Where did the fox walk?",
        "options": ["In the forest", "In the kitchen", "In a car"],
        "answer": "In the forest",
        "explanation": "原文说 fox walked in the forest.",
        "paragraphHint": "回到第 1 段找 forest。"
      }
    ]
  }
`)
}

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']))
  })
}

function taskFromCsvRow(row) {
  const vocabulary = String(row.vocabulary || '')
    .split(';;')
    .map((entry) => {
      const [word, phonetic, meaning, example] = entry.split('|').map((item) => item?.trim() || '')
      return { word, phonetic, meaning, example }
    })
    .filter((item) => item.word || item.meaning || item.example)

  const questions = []
  for (let index = 1; index <= 8; index += 1) {
    const prompt = row[`q${index}Prompt`]
    if (!prompt) {
      continue
    }

    questions.push({
      id: `q${index}`,
      prompt,
      options: String(row[`q${index}Options`] || '')
        .split('|')
        .map((option) => option.trim())
        .filter(Boolean),
      answer: row[`q${index}Answer`],
      explanation: row[`q${index}Explanation`],
      paragraphHint: row[`q${index}Hint`],
    })
  }

  return {
    taskDate: row.taskDate,
    title: row.title,
    level: row.level,
    summary: row.summary,
    paragraphs: String(row.paragraphs || '')
      .split('||')
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
    vocabulary,
    questions,
  }
}

function loadTasks(inputPath) {
  const content = readFileSync(inputPath, 'utf8')
  const extension = extname(inputPath).toLowerCase()

  if (extension === '.csv') {
    return parseCsv(content).map(taskFromCsvRow)
  }

  const parsed = JSON.parse(content)
  return Array.isArray(parsed) ? parsed : [parsed]
}

function validateTask(task, index) {
  const label = `task #${index + 1}`
  if (!/^\d{4}-\d{2}-\d{2}$/.test(task.taskDate || '')) {
    throw new Error(`${label}: taskDate must use YYYY-MM-DD format`)
  }
  if (!task.title || !task.summary) {
    throw new Error(`${label}: title and summary are required`)
  }
  if (!Array.isArray(task.paragraphs) || task.paragraphs.length === 0) {
    throw new Error(`${label}: paragraphs are required`)
  }
  if (!Array.isArray(task.questions) || task.questions.length === 0) {
    throw new Error(`${label}: at least one question is required`)
  }
}

async function requestJson(path, token, init) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.error || `API failed: ${response.status}`)
  }

  return body
}

async function getAdminToken() {
  if (adminToken) {
    return adminToken
  }

  if (!adminUsername || !adminPassword) {
    throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD, or set ADMIN_TOKEN')
  }

  const response = await requestJson('/auth/login', '', {
    method: 'POST',
    body: JSON.stringify({ username: adminUsername, password: adminPassword }),
  })

  if (response.user?.role !== 'admin') {
    throw new Error(`Account ${response.user?.username || adminUsername} is not admin`)
  }

  return response.token
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage()
    return
  }

  const inputPath = process.argv.find((arg) => !arg.startsWith('-') && arg !== process.argv[0] && arg !== process.argv[1])
  if (!inputPath) {
    printUsage()
    process.exit(1)
  }

  const tasks = loadTasks(resolve(inputPath))
  tasks.forEach(validateTask)
  const token = await getAdminToken()

  for (const task of tasks) {
    const response = await requestJson('/english-reading/tasks', token, {
      method: 'POST',
      body: JSON.stringify(task),
    })
    console.log(`Imported English reading task #${response.task.id}: ${response.task.taskDate} ${response.task.title}`)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
