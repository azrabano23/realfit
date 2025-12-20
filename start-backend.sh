#!/bin/bash

# Quick start script for backend (without Docker)

cd "$(dirname "$0")/backend"

# Activate virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

# Install dependencies if needed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "Installing dependencies..."
    pip install -q -r requirements.txt
fi

# Check if database is accessible
echo "Starting backend server..."
echo "Backend will be available at http://localhost:8000"
echo "API docs at http://localhost:8000/docs"
echo ""
echo "Note: Make sure PostgreSQL is running and DATABASE_URL is set correctly"
echo ""

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload


