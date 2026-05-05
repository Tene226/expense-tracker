#!/usr/bin/env bash
# tunnel.sh — expose the expense tracker to the internet via a temporary tunnel
# Usage: ./tunnel.sh [cloudflared|ngrok|localtunnel]
#
# Requirements (install one):
#   cloudflared : https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
#   ngrok       : https://ngrok.com/download  (needs free account + authtoken)
#   localtunnel : npm install -g localtunnel

set -euo pipefail

PORT=80
TOOL="${1:-auto}"

# ── auto-detect ────────────────────────────────────────────────────────────────
if [[ "$TOOL" == "auto" ]]; then
  if command -v cloudflared &>/dev/null; then
    TOOL="cloudflared"
  elif command -v ngrok &>/dev/null; then
    TOOL="ngrok"
  elif command -v lt &>/dev/null; then
    TOOL="localtunnel"
  else
    echo "❌  No tunnel tool found. Install one:"
    echo "    cloudflared : https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    echo "    ngrok       : https://ngrok.com/download"
    echo "    localtunnel : npm install -g localtunnel"
    exit 1
  fi
fi

# ── ensure Docker stack is up ──────────────────────────────────────────────────
if ! docker compose ps --services --filter "status=running" 2>/dev/null | grep -q nginx; then
  echo "⚠️   Docker stack not running. Starting..."
  docker compose up -d
  echo "⏳  Waiting for nginx to be ready..."
  sleep 3
fi

echo "🚇  Starting tunnel via $TOOL → localhost:$PORT"
echo "    Press Ctrl+C to stop."
echo ""

# ── launch tunnel ──────────────────────────────────────────────────────────────
case "$TOOL" in
  cloudflared)
    # Quick tunnel — no account needed, URL printed to stderr
    cloudflared tunnel --url "http://localhost:$PORT"
    ;;

  ngrok)
    # Needs: ngrok config add-authtoken <YOUR_TOKEN>
    ngrok http "$PORT"
    ;;

  localtunnel)
    lt --port "$PORT"
    ;;

  *)
    echo "❌  Unknown tool: $TOOL. Use: cloudflared | ngrok | localtunnel"
    exit 1
    ;;
esac
