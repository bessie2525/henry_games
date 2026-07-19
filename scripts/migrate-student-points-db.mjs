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

try {
  db.exec(readFileSync(schemaPath, 'utf8'))
  console.log(`Student points database migration completed: ${dbPath}`)
} finally {
  db.close()
}
