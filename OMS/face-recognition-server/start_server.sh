#!/bin/bash
# Face Recognition Server Startup Script

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Create necessary directories
mkdir -p images

# Initialize database
echo "Initializing database..."
python3 -c "from server import init_db; init_db()"

# Start the server with Gunicorn
echo "Starting Face Recognition Server with Gunicorn..."
echo "Server will be available at: http://localhost:5002"
echo "Press Ctrl+C to stop the server"

# Run with Gunicorn using the wsgi module
gunicorn --config gunicorn.conf.py wsgi:app
