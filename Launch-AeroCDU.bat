@echo off
cd /d "%~dp0"
if not exist "logs" mkdir logs
wscript.exe "%~dp0Launch-AeroCDU.vbs"
