#!/bin/zsh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="/opt/homebrew/opt/postgresql@16/bin"
DATA_DIR="$PROJECT_DIR/.postgres-data"
LOG_FILE="$PROJECT_DIR/.postgres.log"

if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

PORT="${POSTGRES_PORT:-5433}"

if [ ! -d "$DATA_DIR" ]; then
  echo "PostgreSQL data directory not found: $DATA_DIR" >&2
  echo "Run ./scripts/init-db.sh first." >&2
  exit 1
fi

"$PG_BIN/pg_ctl" -D "$DATA_DIR" -l "$LOG_FILE" start >/dev/null
"$PG_BIN/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null

echo "PostgreSQL is running on port $PORT"
