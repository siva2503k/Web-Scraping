@echo off
title React Frontend Server
color 09
cd /d "%~dp0frontend"

if not exist ".env" (
    copy .env.example .env >nul
)

if not exist "node_modules\" (
    echo Installing node dependencies...
    call npm install
)

echo Starting React Frontend on http://localhost:5173 ...
call npm run dev
pause
