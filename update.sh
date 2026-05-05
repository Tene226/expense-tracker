#!/bin/bash
set -e

cd ~/expense-tracker

echo "[1/4] Stash local config..."
git stash

echo "[2/4] Pull latest from GitHub..."
git pull origin master

echo "[3/4] Restore local config..."
git stash pop || true

echo "[4/4] Rebuild containers..."
docker compose up -d --build

echo ""
sleep 3
curl -s http://localhost/api/health && echo " — OK" || echo "Warning: health check failed"
echo "Done."
