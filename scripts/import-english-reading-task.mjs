#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3001/api'
const adminUsername = process.env.ADMIN_USERNAME
const adminPassword = process.env.ADMIN_PASSWORD
const adminToken = process.env.ADMIN_TOKEN

function printUsage() {
  console.log(`
Usage:
  ADMIN_TOKEN='jwt-token' node scripts/import-english-reading-task.mjs ./reading.json
  ADMIN_USERNAME=bessie ADMIN_PASSWORD='your-password' node scripts/import-english-reading-task.mjs ./reading/2026-07-20.json

Environment:
  API_BASE_URL       API base URL. Default: http://127.0.0.1:3001/api
  ADMIN_USERNAME    Admin username, used with ADMIN_PASSWORD
  ADMIN_PASSWORD    Admin password
  ADMIN_TOKEN       Optional existing admin JWT token

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

function loadTasks(inputPath) {
  const content = readFileSync(inputPath, 'utf8')
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
    throw new Error(body?.error || `API failed: ${init?.method || 'GET'} ${path} -> ${response.status}`)
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
