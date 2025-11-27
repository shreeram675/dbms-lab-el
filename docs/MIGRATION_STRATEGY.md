# Migration Strategy

## 1. Forward-Only Migrations
We prefer forward-only migrations. Avoid destructive changes (e.g., dropping columns) until the code that uses them is fully deprecated and removed in a previous release.

## 2. The "Expand and Contract" Pattern
1. **Expand**: Add the new column/table. Code writes to both old and new.
2. **Migrate**: Backfill data.
3. **Contract**: Remove the old column/table.

## 3. Rollback
If a migration fails:
1. The K8s Job will fail, and the deployment will stop (Helm hook).
2. If data is corrupted, use `restore-db.sh` to restore from the pre-deployment backup.
3. If code is broken, revert the image tag to the previous version using `rollback-to-tag.sh`.
