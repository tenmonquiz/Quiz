@echo off
setlocal
cd /d "%~dp0"
echo Converting quiz workbook to JSON...

where py >nul 2>&1
if not errorlevel 1 goto use_py

where python >nul 2>&1
if errorlevel 1 (
    echo Python 3 was not found. Install Python 3, then run this file again.
    set "conversion_exit_code=9009"
    goto finished
)
python scripts\excel_to_json.py
set "conversion_exit_code=%errorlevel%"
goto finished

:use_py
py -3 scripts\excel_to_json.py
set "conversion_exit_code=%errorlevel%"

:finished
if "%conversion_exit_code%"=="0" (
    echo.
    echo Conversion complete. Updated data\quiz.json, data\kanji.json, and data\photo.json.
    echo Upload these JSON files to GitHub to update the site.
) else (
    echo.
    echo Conversion failed. Review the error above.
)
echo.
pause
exit /b %conversion_exit_code%
