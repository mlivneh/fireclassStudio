@echo off
ECHO Starting the Vibe Studio development environment...

REM Step 1: Open a new CMD window for general command-line tasks.
ECHO Opening a general command prompt...
start "Command Line"

REM Step 2: Open another new CMD window to run the Firebase server.
ECHO Starting Firebase server in a new window...
REM The /k flag keeps the window open.
start "Firebase Server" cmd /k "firebase serve --only hosting,functions"

