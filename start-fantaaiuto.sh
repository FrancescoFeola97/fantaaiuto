#!/bin/bash

# FantaAiuto Startup Script for Linux/macOS
# Version 2.0.0

clear
echo "========================================"
echo "   FantaAiuto - Tracker Fantacalcio"
echo "          Versione 2.0.0"
echo "========================================"
echo ""
echo "Avvio in corso..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERRORE: Node.js non trovato!"
    echo "Per favore installa Node.js da https://nodejs.org/"
    echo ""
    read -p "Premi Invio per continuare..."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERRORE: npm non trovato!"
    echo "Per favore reinstalla Node.js da https://nodejs.org/"
    echo ""
    read -p "Premi Invio per continuare..."
    exit 1
fi

# Change to the script directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installazione dipendenze in corso..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERRORE: Installazione fallita!"
        read -p "Premi Invio per continuare..."
        exit 1
    fi
fi

# Check if build exists
if [ ! -d "dist" ]; then
    echo "Build dell'applicazione in corso..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "ERRORE: Build fallita!"
        read -p "Premi Invio per continuare..."
        exit 1
    fi
fi

echo ""
echo "Avvio FantaAiuto..."
echo ""
echo "CTRL+C per chiudere l'applicazione"
echo ""

# Start the Electron app
npm run electron

echo ""
echo "FantaAiuto chiuso."
read -p "Premi Invio per continuare..."