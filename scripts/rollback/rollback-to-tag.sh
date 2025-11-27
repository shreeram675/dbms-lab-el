#!/bin/bash
# scripts/rollback/rollback-to-tag.sh

TAG=$1

if [ -z "$TAG" ]; then
  echo "Usage: ./rollback-to-tag.sh <TAG>"
  exit 1
fi

echo "🔄 Rolling back to version $TAG..."

# Example for Helm
helm upgrade blockchain-doc-system ./helm/chart --set image.tag=$TAG --reuse-values

# Example for ECS (using AWS CLI)
# aws ecs update-service --cluster blockchain-doc-cluster --service backend --task-definition backend:$TAG

echo "✅ Rollback initiated."
