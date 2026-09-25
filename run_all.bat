@echo off
title Product Sentiment Analyzer and Review Dashboard - Launcher
color 0B

echo =====================================================================
echo    PRODUCT SENTIMENT ANALYZER AND REVIEW DASHBOARD
echo    Automated Local Launcher
echo =====================================================================
echo.

:: 1. Check Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Python is not found in your system PATH!
    echo Please install Python 3.10+ from https://www.python.org/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

:: 2. Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Python and Node.js detected.
echo.

:: 3. Setup Backend Environment if needed
echo [1/4] Preparing Backend Dependencies...
cd /d "%~dp0backend"

if not exist ".env" (
    echo Copying .env.example to .env...
    copy .env.example .env >nul
)

python -c "import flask, selenium, bs4, nltk, textblob, pymongo, pandas, numpy" 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing backend packages from requirements.txt...
    python -m pip install -r requirements.txt
) else (
    echo [OK] Backend Python packages are already installed.
)

:: Download NLTK VADER lexicon quietly
python -c "import nltk; nltk.download('vader_lexicon', quiet=True)" 2>nul

:: 4. Setup Frontend Environment if needed
echo.
echo [2/4] Preparing Frontend Dependencies...
cd /d "%~dp0frontend"

if not exist ".env" (
    echo Copying .env.example to .env...
    copy .env.example .env >nul
)

if not exist "node_modules\" (
    echo Installing frontend npm packages (this may take a minute)...
    call npm install
) else (
    echo [OK] Frontend packages are already installed.
)

:: 5. Launch Backend in new window
echo.
echo [3/4] Starting Flask Backend on http://127.0.0.1:5000 ...
start "Backend - Flask API (Port 5000)" cmd /k "cd /d "%~dp0backend" && python app.py"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

:: 6. Launch Frontend in new window
echo.
echo [4/4] Starting React Frontend on http://localhost:5173 ...
start "Frontend - React Vite (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: Wait 2 seconds and open browser
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo =====================================================================
echo    PROJECT LAUNCHED SUCCESSFULLY!
echo.
echo    Backend API:      http://127.0.0.1:5000
echo    Frontend UI:      http://localhost:5173 (Opened in browser)
echo.
echo    To stop the application, simply close the two command windows.
echo =====================================================================
echo.
pause
