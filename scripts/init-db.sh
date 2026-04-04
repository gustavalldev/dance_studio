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

DB_NAME="${POSTGRES_DB:-dancestudio}"
DB_USER="${POSTGRES_USER:-$USER}"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"
PORT="${POSTGRES_PORT:-5433}"

if [ -d "$DATA_DIR" ]; then
  echo "Data directory already exists: $DATA_DIR" >&2
  echo "Remove it first if you need a clean re-initialization." >&2
  exit 1
fi

"$PG_BIN/initdb" -D "$DATA_DIR" >/dev/null

cat >> "$DATA_DIR/postgresql.conf" <<EOF
port = $PORT
listen_addresses = '127.0.0.1'
unix_socket_directories = '$DATA_DIR'
EOF

"$PG_BIN/pg_ctl" -D "$DATA_DIR" -l "$LOG_FILE" start >/dev/null
trap '"$PG_BIN/pg_ctl" -D "$DATA_DIR" stop >/dev/null' EXIT

if [ "$DB_USER" != "$USER" ]; then
  if [ -n "$DB_PASSWORD" ]; then
    "$PG_BIN/psql" -h 127.0.0.1 -p "$PORT" -d postgres -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';" >/dev/null
  else
    "$PG_BIN/psql" -h 127.0.0.1 -p "$PORT" -d postgres -c "CREATE ROLE $DB_USER WITH LOGIN;" >/dev/null
  fi
  "$PG_BIN/createdb" -h 127.0.0.1 -p "$PORT" -O "$DB_USER" "$DB_NAME"
  PGPASSWORD="$DB_PASSWORD" "$PG_BIN/psql" -h 127.0.0.1 -p "$PORT" -U "$DB_USER" -d "$DB_NAME" -f "$PROJECT_DIR/db.sql" >/dev/null
else
  "$PG_BIN/createdb" -h 127.0.0.1 -p "$PORT" "$DB_NAME"
  "$PG_BIN/psql" -h 127.0.0.1 -p "$PORT" -d "$DB_NAME" -f "$PROJECT_DIR/db.sql" >/dev/null
fi

echo "Database '$DB_NAME' initialized from db.sql on port $PORT"
echo "Connection string: postgresql://$DB_USER@127.0.0.1:$PORT/$DB_NAME"
