#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3001/api'
const adminUsername = process.env.ADMIN_USERNAME
const adminPassword = process.env.ADMIN_PASSWORD
const adminToken = process.env.ADMIN_TOKEN

function todayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function printUsage() {
  console.log(`
Usage:
  ADMIN_USERNAME=bessie ADMIN_PASSWORD='your-password' node scripts/import-word-challenge-task.mjs ./words.json
  ADMIN_TOKEN='jwt-token' node scripts/import-word-challenge-task.mjs ./words.csv --date 2026-07-19 --title "Unit 1 Words"

Environment:
  API_BASE_URL       API base URL. Default: http://127.0.0.1:3001/api
  ADMIN_USERNAME    Admin username, used with ADMIN_PASSWORD
  ADMIN_PASSWORD    Admin password
  ADMIN_TOKEN       Optional existing admin JWT token

Input JSON:
  {
    "taskDate": "2026-07-19",
    "title": "每日英语单词闯关",
    "words": [
      { "word": "apple", "phonetic": "/ˈæpəl/", "meaning": "苹果", "example": "I eat an apple." }
    ]
  }

Input CSV columns:
  word,phonetic,meaning,example
`)
}

function readArgValue(name) {
  const index = process.argv.indexOf(name)
  if (index === -1) {
    return ''
  }

  return process.argv[index + 1] || ''
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

  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']))
  })
}

function normalizeWord(raw) {
  return {
    word: String(raw.word || '').trim(),
    phonetic: String(raw.phonetic || '').trim(),
    meaning: String(raw.meaning || '').trim(),
    example: String(raw.example || '').trim(),
  }
}

function loadTask(inputPath) {
  const content = readFileSync(inputPath, 'utf8')
  const extension = extname(inputPath).toLowerCase()
  const cliDate = readArgValue('--date')
  const cliTitle = readArgValue('--title')

  if (extension === '.csv') {
    return {
      taskDate: cliDate || todayString(),
      title: cliTitle || '每日英语单词闯关',
      words: parseCsv(content).map(normalizeWord),
    }
  }

  const parsed = JSON.parse(content)
  const words = Array.isArray(parsed) ? parsed : parsed.words

  return {
    taskDate: cliDate || parsed.taskDate || todayString(),
    title: cliTitle || parsed.title || '每日英语单词闯关',
    words: words.map(normalizeWord),
  }
}

function validateTask(task) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(task.taskDate)) {
    throw new Error('taskDate must use YYYY-MM-DD format')
  }

  if (!Array.isArray(task.words) || task.words.length !== 10) {
    throw new Error(`word challenge task must include exactly 10 words, got ${task.words?.length || 0}`)
  }

  const invalidIndex = task.words.findIndex((item) => !item.word || !item.meaning || !item.example)
  if (invalidIndex !== -1) {
    throw new Error(`word #${invalidIndex + 1} must include word, meaning, and example`)
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

  const task = loadTask(resolve(inputPath))
  validateTask(task)
  const token = await getAdminToken()
  const response = await requestJson('/word-challenge/tasks', token, {
    method: 'POST',
    body: JSON.stringify(task),
  })

  console.log(`Imported word challenge task #${response.task.id}`)
  console.log(`Date: ${response.task.taskDate}`)
  console.log(`Title: ${response.task.title}`)
  console.log(`Words: ${response.task.words.length}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
