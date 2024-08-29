@echo off

REM Define the number of parallel processes
set "NUM_PROCESSES=10"

REM Counter for tracking the number of processes
set "COUNT=0"

REM Loop through each file
for %%i in (*.265) do (
    REM Start a new instance of ffmpeg in the background
    start /B cmd /C ffmpeg -i "%%i" -an -vf "setpts=0.01*PTS" -aspect 4:3 -c:v libx264 -preset ultrafast "%%~ni.mp4"

    REM Increment the process counter
    set /A "COUNT+=1"

    REM Check if the number of processes launched reaches the defined limit
    if !COUNT! GEQ %NUM_PROCESSES% (
        REM Wait for all launched processes to finish before launching more
        wait
        REM Reset the process counter
        set "COUNT=0"
    )
)

REM Wait for all remaining processes to finish
wait
