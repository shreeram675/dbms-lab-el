#!/bin/bash
# scripts/ci/build-and-push.sh

VERSION=$(git describe --tags --always)
COMMIT_SHA=$(git rev-parse --short HEAD)

echo "🏗️ Building images for version $VERSION ($COMMIT_SHA)..."

# Backend
docker build -t ${DOCKER_REGISTRY:-myregistry}/backend:$VERSION -t ${DOCKER_REGISTRY:-myregistry}/backend:latest -f Dockerfile.backend .
docker push ${DOCKER_REGISTRY:-myregistry}/backend:$VERSION
docker push ${DOCKER_REGISTRY:-myregistry}/backend:latest

# Frontend
docker build -t ${DOCKER_REGISTRY:-myregistry}/frontend:$VERSION -t ${DOCKER_REGISTRY:-myregistry}/frontend:latest -f Dockerfile.frontend .
docker push ${DOCKER_REGISTRY:-myregistry}/frontend:$VERSION
docker push ${DOCKER_REGISTRY:-myregistry}/frontend:latest

# Worker
docker build -t ${DOCKER_REGISTRY:-myregistry}/worker:$VERSION -t ${DOCKER_REGISTRY:-myregistry}/worker:latest -f Dockerfile.worker .
docker push ${DOCKER_REGISTRY:-myregistry}/worker:$VERSION
docker push ${DOCKER_REGISTRY:-myregistry}/worker:latest

echo "✅ Images pushed."
