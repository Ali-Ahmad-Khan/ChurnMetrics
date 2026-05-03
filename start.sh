#!/bin/bash

# Start FastAPI in the background
echo "Starting FastAPI server..."
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 &

# Wait a moment to let it start
sleep 3

# Start Express server in the foreground
echo "Starting Express server..."
cd server && node app.js
