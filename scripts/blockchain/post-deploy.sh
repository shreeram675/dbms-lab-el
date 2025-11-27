#!/bin/bash
# scripts/blockchain/post-deploy.sh

echo "📜 Running Post-Deploy Steps..."

# 1. Read the deployed address
ADDRESS=$(cat deployed_contract.json | grep address | awk -F '"' '{print $4}')

echo "✅ Contract Address: $ADDRESS"

# 2. Update .env or Secrets Manager (Example)
# sed -i "s/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=$ADDRESS/" .env

echo "✅ Post-deploy complete."
