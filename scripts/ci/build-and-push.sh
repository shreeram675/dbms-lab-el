#!/bin/bash
# scripts/ci/build-and-push.sh

VERSION=$(git describe --tags --always)
COMMIT_SHA=$(git rev-parse --short HEAD)

echo "🏗️ Building images for version $VERSION ($COMMIT_SHA)..."

# Backend
docker build -t myregistry/backend:$VERSION -t myregistry/backend:latest -f Dockerfile.backend .
docker push myregistry/backend:$VERSION
docker push myregistry/backend:latest

# Frontend
docker build -t myregistry/frontend:$VERSION -t myregistry/frontend:latest -f Dockerfile.frontend .
docker push myregistry/frontend:$VERSION
docker push myregistry/frontend:latest

# Worker
docker build -t myregistry/worker:$VERSION -t myregistry/worker:latest -f Dockerfile.worker .
docker push myregistry/worker:$VERSION
docker push myregistry/worker:latest

echo "✅ Images pushed."
