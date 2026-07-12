#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SCHEMA_FILE="${REPO_ROOT}/server/sqlite/leaderboard_schema.sql"
DB_PATH="${LEADERBOARD_DB_PATH:-/var/www/henry_games_api/data/leaderboard.sqlite}"
DB_DIR="$(dirname "${DB_PATH}")"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "sqlite3 is required. Install it with: sudo apt install -y sqlite3"
  exit 1
fi

if [[ ! -f "${SCHEMA_FILE}" ]]; then
  echo "Schema file not found: ${SCHEMA_FILE}"
  exit 1
fi

mkdir -p "${DB_DIR}"
sqlite3 "${DB_PATH}" < "${SCHEMA_FILE}"

echo "Leaderboard database initialized: ${DB_PATH}"
