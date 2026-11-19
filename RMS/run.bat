@echo off
title Spicehollic - Premium Restaurant Management & POS Ecosystem
echo =========================================================
echo   Spicehollic - Run Your Restaurant Smarter.
echo   FastAPI + SQLite + WebSockets + Offline-First POS
echo =========================================================
echo.

set "PY_EXE=python"

where python >nul 2>nul
if %errorlevel% equ 0 (
    set "PY_EXE=python"
) else (
    if exist "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" (
        set "PY_EXE=%LOCALAPPDATA%\Programs\Python\Python314\python.exe"
    ) else (
        echo [ERROR] Python not found in PATH or standard directory!
        pause
        exit /b 1
    )
)

echo Starting RESTO DADDY on http://127.0.0.1:8000 ...
"%PY_EXE%" main.py
pause
