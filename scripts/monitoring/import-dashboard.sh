#!/bin/bash
# scripts/monitoring/import-dashboard.sh

GRAFANA_URL="http://admin:admin@localhost:3000"
DASHBOARD_FILE="monitoring/grafana-dashboard.json"

echo "📊 Importing Dashboard..."
curl -X POST -H "Content-Type: application/json" -d @$DASHBOARD_FILE $GRAFANA_URL/api/dashboards/db

echo "✅ Dashboard imported."
