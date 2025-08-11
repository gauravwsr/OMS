@echo off
:: Face Recognition Server Development Startup Script for Windows

:: Get the directory where this script is located
cd /d "%~dp0"

:: Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Install/update requirements
echo Installing requirements...
pip install -r requirements.txt

:: Create necessary directories
if not exist "images" mkdir images

:: Start the server with Flask development server
echo Starting Face Recognition Server in development mode...
echo Server will be available at: http://146.190.165.62:5002
echo Press Ctrl+C to stop the server

:: Run directly with Python
python server.py

pause
