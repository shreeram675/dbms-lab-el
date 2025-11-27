# Operations Manual

## Routine Tasks
- **Backup**: Runs daily at 00:00 UTC via Cron.
- **Key Rotation**: Every 90 days. See `docs/KEY_MANAGEMENT.md`.
- **Log Review**: Check CloudWatch/Grafana weekly for anomalies.

## Troubleshooting
- **High Latency**: Check Redis connection and DB CPU.
- **Blockchain Pending**: Check Gas Price and RPC endpoint health.
