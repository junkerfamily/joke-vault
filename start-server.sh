#!/bin/bash

# Quick start script for Joke Vault
echo "🎭 Starting Joke Vault local server..."

# Function to find an available port
find_available_port() {
    for port in 8000 8001 8002 8003 8080 3000 3001; do
        if ! lsof -i :$port &> /dev/null; then
            echo $port
            return
        fi
    done
    echo "3000"  # fallback
}

PORT=$(find_available_port)

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "Using Python 3 on port $PORT..."
    echo "🌐 Open your browser to: http://localhost:$PORT"
    python3 -m http.server $PORT
# Check if Python is available
elif command -v python &> /dev/null; then
    echo "Using Python on port $PORT..."
    echo "🌐 Open your browser to: http://localhost:$PORT"
    python -m http.server $PORT
# Check if Node.js is available
elif command -v npx &> /dev/null; then
    echo "Using Node.js serve on port $PORT..."
    echo "🌐 Open your browser to: http://localhost:$PORT"
    npx serve . -p $PORT
else
    echo "❌ No suitable server found!"
    echo "Please install Python or Node.js to run the local server."
    echo "Alternatively, use a code editor with a built-in server like VS Code with Live Server extension."
    exit 1
fi
