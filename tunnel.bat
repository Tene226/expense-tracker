@echo off
title Expense Tracker - Ngrok
echo.
echo  ==============================
echo   Ngrok - Tunnel public
echo  ==============================
echo.

:: Verifier que ngrok est installe
where ngrok.exe >nul 2>&1
if errorlevel 1 (
    echo ERREUR : ngrok non trouve dans le PATH.
    echo.
    echo  Installer ngrok :
    echo  1. Telecharger sur https://ngrok.com/download
    echo  2. Extraire ngrok.exe dans C:\Windows\System32\
    echo     OU ajouter son dossier au PATH Windows.
    echo.
    echo  Ou via winget :
    echo    winget install ngrok.ngrok
    echo.
    pause & exit /b 1
)

echo  L'app doit deja tourner ^(lancer start.bat d'abord^).
echo.
echo  Tunnel vers http://localhost:5173 ...
echo  URL publique affichee ci-dessous. Ctrl+C pour arreter.
echo.

ngrok.exe http 5173
