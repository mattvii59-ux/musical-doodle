#!/bin/bash
# Cherkasy Departures System - Setup and Test Script

echo "================================"
echo "Cherkasy Departures System Setup"
echo "================================"
echo ""

# Check for Node.js
if command -v node &> /dev/null; then
    echo "✓ Node.js found: $(node --version)"
else
    echo "✗ Node.js not found. Please install Node.js"
    exit 1
fi

# Check for required files
echo ""
echo "Checking files..."

files=(
    "server.mjs"
    "index.html"
    "cherkasy_trolleybus_gtfs.zip"
    "realtime-free.pb"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (missing)"
    fi
done

echo ""
echo "Starting server..."
echo "Open: http://127.0.0.1:4173/"
echo ""

# Start the server
node server.mjs
