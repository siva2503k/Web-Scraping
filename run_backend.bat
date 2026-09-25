@echo off
title Flask Backend Server
color 0A
cd /d "%~dp0backend"

if not exist ".env" (
    copy .env.example .env >nul
)

echo Starting Flask Backend on http://127.0.0.1:5000 ...
python app.py
pause
