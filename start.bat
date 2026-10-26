@echo off
title HerLog - Sovereign Daily Life Log Keeper
echo =======================================================
echo   HerLog - Sovereign Personal Daily Life Log Keeper
echo   AES-256 Partition Simulation & Markdown Log Storage
echo =======================================================
echo.
echo Launching local server on http://localhost:8000 ...
start "" "http://localhost:8000"
python -m http.server 8000
pause
