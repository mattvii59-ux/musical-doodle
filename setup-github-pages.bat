@echo off
REM Quick setup script for GitHub Pages deployment (Windows)

echo.
echo 🚌 Cherkasy Departures System - GitHub Pages Setup
echo ==================================================
echo.

REM Check if git is initialized
if not exist .git (
    echo ❌ Git not initialized. Run this first:
    echo    git init
    echo    git remote add origin https://github.com/YOUR_USERNAME/GTFS-DEPARTES.git
    exit /b 1
)

REM Check if index.html exists
if not exist index.html (
    echo ❌ index.html not found in current directory
    exit /b 1
)

REM Check if .github\workflows\pages.yml exists
if not exist .github\workflows\pages.yml (
    echo ❌ GitHub workflow not found in .github\workflows\pages.yml
    echo    Please ensure the file exists - see DEPLOYMENT_GUIDE.md
    exit /b 1
)

echo ✅ Project structure verified:
echo    ✓ Git repository initialized
echo    ✓ index.html present
echo    ✓ GitHub Pages workflow present
echo.

REM Get current branch
for /f "tokens=*" %%A in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set BRANCH=%%A
if "%BRANCH%"=="" set BRANCH=main

echo 📝 Next steps:
echo.
echo 1. Push to GitHub:
echo    git add .
echo    git commit -m "Initial commit: Cherkasy departures system"
echo    git push -u origin %BRANCH%
echo.
echo 2. Enable GitHub Pages:
echo    - Go to: https://github.com/YOUR_USERNAME/GTFS-DEPARTES/settings/pages
echo    - Source: Select 'GitHub Actions'
echo    - Save
echo.
echo 3. Check deployment:
echo    - Go to: https://github.com/YOUR_USERNAME/GTFS-DEPARTES/actions
echo    - Wait for workflow to complete (✅ green checkmark^)
echo.
echo 4. Access your site:
echo    - https://YOUR_USERNAME.github.io/GTFS-DEPARTES/
echo.
echo 🚀 Setup complete! Follow the steps above to deploy.
echo.
pause
