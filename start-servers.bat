@echo off
echo ===============================================
echo           OMS - Starting All Servers
echo ===============================================
echo.

echo 🚀 Starting Backend Server (Port 5000)...
start "OMS Backend Server" cmd /k "cd /d d:\OMS\OMS\OMS\server-OMS && npm start"

timeout /t 3

echo 🤖 Starting Face Recognition Server (Port 5001)...
start "Face Recognition Server" cmd /k "cd /d d:\OMS\OMS\face-recognition-server && python server.py"

timeout /t 3

echo 🌐 Starting Frontend React App (Port 3000)...
start "React Frontend" cmd /k "cd /d d:\OMS\OMS\OMS\Office-management-system && npm start"

echo.
echo ✅ All servers are starting...
echo.
echo 📋 Server URLs:
echo - Frontend: http://localhost3000
echo - Backend API: http://localhost5000
echo - Face Recognition: http://localhost5001
echo.
echo 💡 Check each terminal window for server status
echo 💡 Press Ctrl+C in any terminal to stop that server
echo.
pause
