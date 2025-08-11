@echo off
:: Face Recognition Server Startup Script for Windows

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

:: Initialize database
echo Initializing database...
python -c "from server import init_db; init_db()"

:: Start the server with Gunicorn
echo Starting Face Recognition Server with Gunicorn...
echo Server will be available at: http://localhost:5002
echo Press Ctrl+C to stop the server

:: Run with Gunicorn using the wsgi module
gunicorn --config gunicorn.conf.py wsgi:app

pause
