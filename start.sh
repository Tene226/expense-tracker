#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo "=============================="
echo " Expense Tracker - Démarrage"
echo "=============================="
echo ""

mkdir -p "$ROOT/data"

# Backend
cd "$ROOT/backend"
if [ ! -d node_modules ]; then
    echo -e "${BLUE}[1/4] Installation des dépendances backend...${NC}"
    npm install
fi

echo -e "${BLUE}[2/4] Démarrage du backend sur le port 3001...${NC}"
NODE_ENV=development PORT=3001 DB_PATH="$ROOT/data/expenses.db" node server.js &
BACKEND_PID=$!

# Frontend
cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
    echo -e "${BLUE}[3/4] Installation des dépendances frontend...${NC}"
    npm install
fi

echo -e "${BLUE}[4/4] Démarrage du frontend...${NC}"
npm run dev &
FRONTEND_PID=$!

# Ouvrir le navigateur
sleep 3
if command -v xdg-open &>/dev/null; then
    xdg-open http://localhost:5173
elif command -v open &>/dev/null; then
    open http://localhost:5173
fi

echo ""
echo -e "${GREEN} Backend  : http://localhost:3001/api/health${NC}"
echo -e "${GREEN} Frontend : http://localhost:5173${NC}"
echo ""
echo " Ctrl+C pour tout arrêter."
echo ""

# Arrêt propre sur Ctrl+C
trap "echo ''; echo 'Arrêt...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait $BACKEND_PID $FRONTEND_PID
