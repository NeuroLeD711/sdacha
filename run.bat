@echo off
chcp 65001 >nul
echo ======================================
echo   Фриланс-Эскроу: Запуск системы
echo ======================================

set BACKEND_DIR=%~dp0backend
set FRONTEND_DIR=%~dp0frontend

echo.
echo [1/4] Установка зависимостей backend...
cd /d "%BACKEND_DIR%"
pip install -r requirements.txt

echo.
echo [2/4] Инициализация БД и seed-данные...
python seed.py

echo.
echo [3/4] Установка зависимостей frontend...
cd /d "%FRONTEND_DIR%"
call npm install

echo.
echo [4/4] Запуск серверов...
echo Backend (Flask): http://localhost:5000
echo Frontend (Vite): http://localhost:5173
echo.

start "Backend" cmd /c "cd /d %BACKEND_DIR% && python app.py"
start "Frontend" cmd /c "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo Система запущена!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
