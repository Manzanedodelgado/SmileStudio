#!/bin/bash
# ─── SmileStudio — Setup Backup Cron ────────────────────
# Configures automatic daily backup + NAS sync
# Run once after initial deploy

set -euo pipefail

APP_DIR="/opt/smilestudio"
BACKUP_SCRIPT="$APP_DIR/scripts/backup.sh"

echo "🦷 SmileStudio — Backup Cron Setup"
echo "════════════════════════════════════════"

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"

# Add cron job: daily at 3:00 AM
CRON_JOB="0 3 * * * $BACKUP_SCRIPT >> /opt/smilestudio/logs/backup.log 2>&1"

(crontab -l 2>/dev/null | grep -v "backup.sh"; echo "$CRON_JOB") | crontab -

echo "✅ Cron configurado: backup diario a las 3:00 AM"
echo "  Script: $BACKUP_SCRIPT"
echo "  Log:    /opt/smilestudio/logs/backup.log"
echo ""
echo "Para verificar: crontab -l"
echo "Para test manual: $BACKUP_SCRIPT"
