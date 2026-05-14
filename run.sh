#!/bin/bash
set -e

echo "======================================"
echo "  Фриланс-Эскроу: Запуск системы"
echo "======================================"

BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"
FRONTEND_DIR="$(cd "$(dirname "$0")/frontend" && pwd)"

echo ""
echo "[1/4] Установка зависимостей backend..."
cd "$BACKEND_DIR"
pip install --break-system-packages -r requirements.txt

echo ""
echo "[2/4] Инициализация БД и seed-данные..."
python seed.py

echo ""
echo "[3/4] Установка зависимостей frontend..."
cd "$FRONTEND_DIR"
npm install

echo ""
echo "[4/4] Запуск серверов..."
echo "Backend (Flask): http://localhost:5000"
echo "Frontend (Vite): http://localhost:5173"
echo ""

cd "$BACKEND_DIR"
python app.py &
BACKEND_PID=$!

cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Система запущена!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Нажмите Ctrl+C для остановки"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Система остановлена.'; exit" INT TERM

wait
