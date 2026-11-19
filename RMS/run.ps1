# RESTO DADDY Launcher Script for PowerShell
$ErrorActionPreference = "Stop"

$pythonPath = "python"
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonPath = "python"
} elseif (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python314\python.exe") {
    $pythonPath = "$env:LOCALAPPDATA\Programs\Python\Python314\python.exe"
} else {
    Write-Error "Python executable not located. Please install Python or add it to PATH."
}

Write-Host "=========================================================" -ForegroundColor DarkYellow
Write-Host "  Spicehollic - Run Your Restaurant Smarter." -ForegroundColor Yellow
Write-Host "  Starting FastAPI backend on http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor DarkYellow

& $pythonPath main.py
