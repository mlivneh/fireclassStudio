@echo off
REM -- This command ensures the script runs from the project's root directory --
cd /d %~dp0

ECHO.
ECHO =======================================================
ECHO  Firebase Environment Diagnostic Tool
ECHO =======================================================
ECHO.
ECHO This script will check your system's configuration.
ECHO Please copy ALL of the text below and send it back.
ECHO.
ECHO -------------------------------------------------------
ECHO  1. Current Directory
ECHO -------------------------------------------------------
echo %cd%
ECHO.
ECHO -------------------------------------------------------
ECHO  2. System PATH Variable
ECHO -------------------------------------------------------
echo %PATH%
ECHO.
ECHO -------------------------------------------------------
ECHO  3. Locating Node.js, NPX, and Firebase
ECHO -------------------------------------------------------
where node
where npx
where firebase
ECHO.
ECHO =======================================================
ECHO  End of Diagnostic Report
ECHO =======================================================
ECHO.
PAUSE
