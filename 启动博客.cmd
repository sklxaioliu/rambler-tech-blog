@echo off
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 24 LTS first.
  pause
  exit /b 1
)
if not exist node_modules\hexo\bin\hexo (
  echo Dependencies are missing. Run npm.cmd ci in this folder first.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:4000/ in your browser.
echo Keep this window open. Press Ctrl+C to stop the blog.
node node_modules\hexo\bin\hexo server --ip 127.0.0.1 --port 4000
pause
