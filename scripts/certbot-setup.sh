#!/bin/bash
# scripts/certbot-setup.sh

DOMAIN="example.com"
EMAIL="admin@example.com"

echo "🔒 Requesting SSL Certificate for $DOMAIN..."

# Assumes nginx is running and port 80 is open
certbot --nginx -d $DOMAIN -m $EMAIL --agree-tos --non-interactive

echo "✅ Certificate obtained. Reloading Nginx..."
nginx -s reload
