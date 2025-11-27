# Security Incident Response

## 1. Detection
- Alerts from WAF, GuardDuty, or User Reports.

## 2. Containment
- **Block IP**: Add IP to WAF Blocklist.
- **Revoke Keys**: If keys compromised, rotate immediately.
- **Shutdown**: If critical, stop services via `scripts/local/down.sh` or AWS Console.

## 3. Eradication
- Patch vulnerability.
- Rebuild images.

## 4. Recovery
- Restore data if needed.
- Deploy patched version.
