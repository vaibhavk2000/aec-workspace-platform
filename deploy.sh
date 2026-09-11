#!/bin/bash
set -e

echo "======================================================"
echo "🚀 AECWebService - Automated Production Deployment Engine"
echo "======================================================"

# Verify Docker daemon is accessible
if ! [ -x "$(command -v docker)" ]; then
  echo "❌ Error: Docker engine environment is not active." >&2
  exit 1
fi

# Initialize persistent structural buffering workspaces
mkdir -p ./backend/temp_uploads

# Set environmental fallbacks if variables are absent
export JWT_SECRET_KEY="${JWT_SECRET_KEY:-super_secret_aec_platform_key_9931}"
export DB_PASSWORD="${DB_PASSWORD:-secret}"
export DB_NAME="${DB_NAME:-aec_db}"
export DB_USER="${DB_USER:-postgres}"

# Hot reload deployment container targets
echo "📦 Restarting container stacks..."
docker compose down --remove-orphans
docker compose up --build -d

# Cleanup system caches
docker system prune -f

echo "======================================================"
echo "✅ AECWebService is live and running on port 80!"
echo "======================================================"
