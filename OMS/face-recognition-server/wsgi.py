#!/usr/bin/env python3
"""
WSGI entry point for the Face Recognition Server
This file is used by Gunicorn to run the Flask application
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

from server import app

# Initialize the database and create images directory
from server import init_db, IMAGES_DIR

os.makedirs(IMAGES_DIR, exist_ok=True)
init_db()

if __name__ == "__main__":
    app.run()
