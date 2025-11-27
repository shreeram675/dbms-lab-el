#!/bin/bash
# scripts/deploy/production.sh

if [ "$CONFIRM" != "true" ]; then
  echo "❌ Error: Set CONFIRM=true to deploy to production."
  exit 1
fi

echo "🚀 Deploying to PRODUCTION..."

# 1. Terraform Apply
cd terraform
terraform init
terraform apply -var="env=production" -auto-approve
cd ..

# 2. Helm Upgrade
helm upgrade --install blockchain-doc-prod ./helm/chart \
  --set image.tag=v1.0.0 \
  --namespace production \
  --create-namespace

echo "✅ Production Deployed."
