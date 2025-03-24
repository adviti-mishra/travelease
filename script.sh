#!/bin/bash

# Navigate to travelease-app
cd "$(dirname "$0")/travelease-app" || { echo "Failed to navigate to travelease-app"; exit 1; }

# Run frontend build
echo "Building frontend..."
npm run build || { echo "Frontend build failed"; exit 1; }

# Navigate to backend
cd backend || { echo "Failed to navigate to backend"; exit 1; }

# Run backend server
echo "Starting backend..."
python3 app.py

