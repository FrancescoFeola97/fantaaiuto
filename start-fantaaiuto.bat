@echo off
cls
echo ========================================
echo    FantaAiuto - Tracker Fantacalcio
echo           Versione 2.0.0
echo ========================================
echo.
echo Avvio in corso...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRORE: Node.js non trovato!
    echo Per favore installa Node.js da https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRORE: npm non trovato!
    echo Per favore reinstalla Node.js da https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Change to the script directory
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installazione dipendenze in corso...
    call npm install
    if %errorlevel% neq 0 (
        echo ERRORE: Installazione fallita!
        pause
        exit /b 1
    )
)

REM Check if build exists
if not exist "dist" (
    echo Build dell'applicazione in corso...
    call npm run build
    if %errorlevel% neq 0 (
        echo ERRORE: Build fallita!
        pause
        exit /b 1
    )
)

echo.
echo Avvio FantaAiuto...
echo.
echo CTRL+C per chiudere l'applicazione
echo.

REM Start the Electron app
call npm run electron

echo.
echo FantaAiuto chiuso.
pause