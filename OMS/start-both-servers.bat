@echo off
echo Starting OMS Backend Servers...
echo.

REM Start Node.js server in a new window
echo Starting Node.js server on port 5001...
start "OMS Node.js Server" cmd /k "cd /d d:\OMS\OMS\OMS\server-OMS && node server.js"

REM Wait a bit for Node.js server to start
timeout /t 3 /nobreak > nul

REM Start Python face recognition server in a new window
echo Starting Python face recognition server on port 5002...
start "Face Recognition Server" cmd /k "cd /d d:\OMS\OMS\OMS\face-recognition-server && C:/Users/Lenovo/AppData/Local/Programs/Python/Python313/python.exe server.py"

echo.
echo Both servers are starting...
echo - Node.js server: http://localhost:5001
echo - Python face recognition server: http://localhost:5002
echo.
echo Press any key to exit this window (servers will continue running)
pause > nul
