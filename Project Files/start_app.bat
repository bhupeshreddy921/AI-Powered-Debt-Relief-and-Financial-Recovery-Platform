@echo off
title Antigravity Debt Relief Launcher
echo =======================================================
echo     Antigravity Debt Relief Launcher
echo =======================================================
echo.
echo Starting FastAPI Backend on port 8000...
start cmd /k "title FastAPI Backend && cd /d %~dp0 && python -m uvicorn backend.main:app --port 8000"

echo Starting React Frontend on port 5175...
start cmd /k "title React Frontend && cd /d %~dp0 && npm run dev -- --host 127.0.0.1 --port 5175"

echo.
echo Launching web browser in 3 seconds...
timeout /t 3 >nul
start http://127.0.0.1:5175

echo.
echo Launcher complete. Close the newly opened terminal windows to stop the servers.
echo =======================================================
pause
