#!/bin/bash

# Quick start script for Joke Vault
echo "🎭 Starting Joke Vault local server..."

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "Using Python 3..."
    python3 -m http.server 8000
# Check if Python is available
elif command -v python &> /dev/null; then
    echo "Using Python..."
    python -m http.server 8000
# Check if Node.js is available
elif command -v npx &> /dev/null; then
    echo "Using Node.js serve..."
    npx serve . -p 8000
else
    echo "❌ No suitable server found!"
    echo "Please install Python or Node.js to run the local server."
    echo "Alternatively, use a code editor with a built-in server like VS Code with Live Server extension."
    exit 1
fi
