#!/bin/bash
# scripts/local/up.sh

echo "🚀 Starting Local Environment..."

# 1. Build and Start Containers
docker-compose up -d --build

# 2. Wait for DB
echo "⏳ Waiting for Database..."
sleep 5

# 3. Run Migrations (Assuming backend has a migrate script or we run SQL directly)
# For this demo, we'll execute the SQL file directly in the postgres container
echo "📦 Running Migrations..."
docker-compose exec -T postgres psql -U postgres -d db_proj < migrations/001_init_schema.sql

# 4. Seed Data
echo "🌱 Seeding Demo Data..."
docker-compose exec -T postgres psql -U postgres -d db_proj < seeds/demo_data.sql

# 5. Deploy Contract (Placeholder for now, will be implemented in Step 4)
# echo "📜 Deploying Smart Contract..."
# cd scripts && node deploy.js

echo "✅ Environment Up!"
echo "Frontend: http://localhost:8080"
echo "Backend: http://localhost:3000"
echo "Vault: http://localhost:8200"
