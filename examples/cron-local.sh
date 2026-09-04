#!/usr/bin/env bash
# ==============================================================================
# SupaVault Local Cron Backup Runner
# ==============================================================================
# Usage:
#   1. Edit environment variables below
#   2. Add to crontab via `crontab -e`:
#      0 3 * * * /path/to/SupaVault/examples/cron-local.sh >> /var/log/supavault.log 2>&1
# ==============================================================================

set -euo pipefail

# Configuration
export SUPAVAULT_HOST="db.xxxxxxxxxxxxxx.supabase.co"
export SUPAVAULT_PORT="5432"
export SUPAVAULT_DATABASE="postgres"
export SUPAVAULT_USER="postgres"
export SUPAVAULT_PASSWORD="your_database_password"
export SUPAVAULT_SSL="require"
export SUPAVAULT_OUT_DIR="$HOME/backups/supavault"

mkdir -p "$SUPAVAULT_OUT_DIR"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting SupaVault automated backup..."

npx supavault backup \
  --host "$SUPAVAULT_HOST" \
  --port "$SUPAVAULT_PORT" \
  --database "$SUPAVAULT_DATABASE" \
  --user "$SUPAVAULT_USER" \
  --password "$SUPAVAULT_PASSWORD" \
  --ssl "$SUPAVAULT_SSL" \
  --type "full" \
  --out "$SUPAVAULT_OUT_DIR"

# Keep only the last 14 days of backups
find "$SUPAVAULT_OUT_DIR" -type f -name "supavault_*.dump" -mtime +14 -delete

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup finished successfully."
