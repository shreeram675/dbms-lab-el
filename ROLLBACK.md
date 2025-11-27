# Rollback Guide

## Scenario A: Bad Code Deployment
1. Identify the last working tag (e.g., `v1.0.0`).
2. Run:
   ```bash
   ./scripts/rollback/rollback-to-tag.sh v1.0.0
   ```

## Scenario B: Database Corruption
1. Stop the application.
2. Restore from backup:
   ```bash
   ./scripts/backup/restore-db.sh backup_2023_10_27.sql
   ```
3. Restart application.
