#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage:"
  echo "  ADMIN_PASSWORD='your-password' ./add_reading.sh YYYY-MM-DD"
  echo "  ADMIN_PASSWORD='your-password' ./add_reading.sh ./path/to/task.json"
  exit 1
fi

TASK_INPUT="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ "${TASK_INPUT}" == *.json ]]; then
  INPUT_FILE="${TASK_INPUT}"
else
  INPUT_FILE="${SCRIPT_DIR}/${TASK_INPUT}.json"
fi

if [ ! -f "${INPUT_FILE}" ]; then
  echo "JSON file not found: ${INPUT_FILE}"
  exit 1
fi

: "${ADMIN_PASSWORD:?Set ADMIN_PASSWORD before running this script}"

API_BASE_URL="${API_BASE_URL:-http://122.51.118.105/api}" \
ADMIN_USERNAME="${ADMIN_USERNAME:-bessie}" \
ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
node "${REPO_ROOT}/scripts/import-english-reading-task.mjs" "${INPUT_FILE}"
