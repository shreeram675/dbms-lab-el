#!/bin/bash
# scripts/backup/backup-db.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$TIMESTAMP.sql"

echo "💾 Backing up Database to $BACKUP_FILE..."

docker-compose exec -T postgres pg_dump -U postgres db_proj > $BACKUP_FILE

# Optional: Upload to S3
# aws s3 cp $BACKUP_FILE s3://my-backups/

echo "✅ Backup Complete."
