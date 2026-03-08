#!/bin/bash
# ─── SmileStudio Backup Script ───────────────────────────
# Runs daily via cron: 0 3 * * * /path/to/backup.sh
#
# Creates encrypted PostgreSQL backup and syncs to NAS Buffalo
# Usage: ./backup.sh [full|db-only]

set -euo pipefail

# ─── Config ──────────────────────────────────────────────
BACKUP_DIR="/tmp/smilestudio-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="smilestudio-db"
DB_NAME="smilestudio"
DB_USER="smilestudio"
GPG_RECIPIENT="${BACKUP_GPG_RECIPIENT:-backup@rubiogarcia.dental}"
NAS_PATH="${BACKUP_NAS_PATH:-/mnt/nas/backups}"
RETENTION_DAYS=30

# ─── Create backup directory ────────────────────────────
mkdir -p "$BACKUP_DIR"

echo "🦷 SmileStudio Backup — $(date)"
echo "─────────────────────────────────────"

# ─── Database Backup ─────────────────────────────────────
echo "📦 Backing up PostgreSQL..."
DB_BACKUP="$BACKUP_DIR/smilestudio_db_${TIMESTAMP}.sql.gz"

docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$DB_BACKUP"

echo "   ✅ DB dump: $(du -h "$DB_BACKUP" | cut -f1)"

# ─── Encrypt ─────────────────────────────────────────────
echo "🔒 Encrypting backup..."
gpg --encrypt --recipient "$GPG_RECIPIENT" --output "${DB_BACKUP}.gpg" "$DB_BACKUP"
rm "$DB_BACKUP"  # Remove unencrypted version

echo "   ✅ Encrypted: ${DB_BACKUP}.gpg"

# ─── Upload Files (if full backup) ──────────────────────
if [ "${1:-full}" = "full" ]; then
    echo "📁 Backing up uploaded files..."
    UPLOADS_BACKUP="$BACKUP_DIR/smilestudio_uploads_${TIMESTAMP}.tar.gz"
    docker cp smilestudio-api:/app/uploads - | gzip > "$UPLOADS_BACKUP"
    echo "   ✅ Uploads: $(du -h "$UPLOADS_BACKUP" | cut -f1)"
fi

# ─── Sync to NAS ─────────────────────────────────────────
if [ -d "$NAS_PATH" ]; then
    echo "📤 Syncing to NAS Buffalo..."
    rsync -av --progress "$BACKUP_DIR/" "$NAS_PATH/smilestudio/"
    echo "   ✅ Synced to NAS"
else
    echo "   ⚠️  NAS not mounted at $NAS_PATH — skipping sync"
fi

# ─── Cleanup old backups ────────────────────────────────
echo "🧹 Cleaning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "smilestudio_*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

echo ""
echo "✅ Backup completed at $(date)"
