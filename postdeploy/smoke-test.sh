#!/bin/bash
# postdeploy/smoke-test.sh

URL=$1
if [ -z "$URL" ]; then URL="http://localhost:8080"; fi

echo "🧪 Running Smoke Tests against $URL..."

# 1. Health Check
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" $URL)
if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ Health Check Failed: $HTTP_STATUS"
  exit 1
fi

echo "✅ Health Check Passed"
exit 0
