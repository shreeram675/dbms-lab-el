#!/bin/bash
# scripts/backup/restore-db.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-db.sh <backup_file.sql>"
  exit 1
fi

echo "⚠️ Restoring Database from $BACKUP_FILE..."

cat $BACKUP_FILE | docker-compose exec -T postgres psql -U postgres -d db_proj

echo "✅ Restore Complete."
