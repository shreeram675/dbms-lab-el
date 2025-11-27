#!/bin/bash
# scripts/deploy/staging.sh

echo "🚀 Deploying to Staging..."

# 1. Terraform Apply
cd terraform
terraform init
terraform apply -var="env=staging" -auto-approve
cd ..

# 2. Helm Upgrade
helm upgrade --install blockchain-doc-staging ./helm/chart \
  --set image.tag=staging \
  --namespace staging \
  --create-namespace

echo "✅ Staging Deployed."
