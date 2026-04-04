#!/bin/zsh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="/opt/homebrew/opt/postgresql@16/bin"
DATA_DIR="$PROJECT_DIR/.postgres-data"

if [ ! -d "$DATA_DIR" ]; then
  echo "PostgreSQL data directory not found: $DATA_DIR" >&2
  exit 1
fi

"$PG_BIN/pg_ctl" -D "$DATA_DIR" stop
