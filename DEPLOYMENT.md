# Deployment Playbook

## 1. Prerequisites
- Docker & Docker Compose
- Node.js 18+
- AWS CLI / Terraform (for Cloud)

## 2. Local Development
```bash
./scripts/local/up.sh
```

## 3. Staging Deployment
```bash
./scripts/deploy/staging.sh
```

## 4. Production Deployment
```bash
export CONFIRM=true
./scripts/deploy/production.sh
```

## 5. Verification
Run smoke tests:
```bash
./postdeploy/smoke-test.sh https://example.com
```
