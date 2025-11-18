#!/usr/bin/env bash
set -euo pipefail
PORT=${PORT:-3000}
HOST=${HOST:-0.0.0.0}

# Inject .env into dev server
export $(grep -v '^#' .env | xargs 2>/dev/null || true)

exec node node_modules/vite/bin/vite.js --host "$HOST" --port "$PORT"
