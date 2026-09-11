#!/bin/bash
set -e
echo "🚀 Launching AECWebService Deployment Stack..."
mkdir -p ./backend/temp_uploads

docker compose down --remove-orphans
docker compose up --build -d
docker system prune -f
echo "✅ Deployment operational at port 80!"
