#!/usr/bin/env bash
# Product Sentiment Analyzer and Review Dashboard - Launcher for Linux/macOS

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "====================================================================="
echo "   PRODUCT SENTIMENT ANALYZER AND REVIEW DASHBOARD"
echo "====================================================================="

# Check Python3 and Node
command -v python3 >/dev/null 2>&1 || { echo "Python3 is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }

echo "[1/4] Preparing Backend..."
cd "$DIR/backend"
if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
python3 -c "import nltk; nltk.download('vader_lexicon', quiet=True)"

echo "[2/4] Preparing Frontend..."
cd "$DIR/frontend"
if [ ! -f .env ]; then
  cp .env.example .env
fi
if [ ! -d "node_modules" ]; then
  npm install
fi

echo "[3/4] Starting Flask Backend..."
cd "$DIR/backend"
python3 app.py &
BACKEND_PID=$!

echo "[4/4] Starting React Frontend..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo "Opening http://localhost:5173 ..."
sleep 3
if which xdg-open > /dev/null; then
  xdg-open http://localhost:5173
elif which open > /dev/null; then
  open http://localhost:5173
fi

echo "Servers running. Press Ctrl+C to stop."
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
