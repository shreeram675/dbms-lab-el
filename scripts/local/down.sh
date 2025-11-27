#!/bin/bash
# scripts/local/down.sh

echo "🛑 Stopping Local Environment..."
docker-compose down
echo "✅ Environment Stopped."
