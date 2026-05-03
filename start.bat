@echo off
title Expense Tracker - Demarrage
setlocal enabledelayedexpansion

set ROOT=%~dp0
set DATA=%ROOT%data

echo.
echo  ==============================
echo   Expense Tracker - Demarrage
echo  ==============================
echo.

:: Creer dossier data
if not exist "%DATA%" mkdir "%DATA%"

:: -------------------------------------------------------
:: BACKEND
:: -------------------------------------------------------
echo [1/4] Backend - Installation des dependances...
cd /d "%ROOT%backend"
if errorlevel 1 (
    echo ERREUR : dossier backend introuvable.
    pause & exit /b 1
)

:: Supprimer node_modules corrompu si package-lock absent ou si better-sqlite3 present
if exist "node_modules\better-sqlite3" (
    echo       Suppression de l'ancien node_modules ^(better-sqlite3 detecte^)...
    rd /s /q node_modules 2>nul
    del /q package-lock.json 2>nul
)

call npm install
if errorlevel 1 (
    echo.
    echo ERREUR : npm install backend a echoue. Voir ci-dessus.
    pause & exit /b 1
)

echo.
echo [2/4] Backend - Demarrage sur le port 3001...
start "Expense Backend" cmd /k "cd /d %ROOT%backend && set NODE_ENV=development&& set PORT=3001&& set DB_PATH=%DATA%\expenses.db&& node server.js"

:: -------------------------------------------------------
:: FRONTEND
:: -------------------------------------------------------
echo.
echo [3/4] Frontend - Installation des dependances...
cd /d "%ROOT%frontend"
if errorlevel 1 (
    echo ERREUR : dossier frontend introuvable.
    pause & exit /b 1
)

call npm install
if errorlevel 1 (
    echo.
    echo ERREUR : npm install frontend a echoue. Voir ci-dessus.
    pause & exit /b 1
)

echo.
echo [4/4] Frontend - Demarrage sur le port 5173...
start "Expense Frontend" cmd /k "cd /d %ROOT%frontend && npm run dev"

echo.
echo  Ouverture du navigateur dans 5 secondes...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo  ==============================
echo   DEMARRAGE OK
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:3001/api/health
echo  ==============================
echo.
echo  Fermer "Expense Backend" et "Expense Frontend" pour arreter.
echo.
pause
