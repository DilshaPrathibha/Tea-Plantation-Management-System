@echo off
echo Starting ngrok tunnel...
echo Domain: https://unpredicated-uncomplete-roberto.ngrok-free.app
echo Backend Port: 5001
echo.

cd /d "d:\ITP"
.\ngrok.exe http --domain=unpredicated-uncomplete-roberto.ngrok-free.app 5001

pause