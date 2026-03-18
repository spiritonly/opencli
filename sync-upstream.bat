@echo off
chcp 65001 >nul
REM 同步上游仓库脚本

cd /d D:\code\opencli

echo [1/5] Fetching upstream updates...
git fetch upstream

echo [2/5] Merging upstream/main into local main...
git checkout main
git merge upstream/main

echo [3/5] Pushing to your fork (origin)...
git push origin main

echo [4/5] Building project...
npm run build

echo [5/5] Linking to global...
npm link

echo.
echo ===== Sync Complete! =====
echo Your fork is now up to date with upstream.
echo.
pause
