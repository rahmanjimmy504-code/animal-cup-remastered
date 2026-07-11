@echo off
chcp 65001 > nul
title Animal Cup - 安裝中

cd /d "%~dp0"

echo.
echo  ================================
echo   Animal Cup 第一次安裝
echo  ================================
echo.

:: 確認 Node.js 已安裝
node --version > nul 2>&1
if errorlevel 1 (
    echo  [錯誤] 找不到 Node.js！
    echo.
    echo  請先安裝 Node.js：
    echo  https://nodejs.org  選 LTS 版本下載安裝
    echo.
    pause
    exit /b 1
)

echo  Node.js 已安裝 ...OK
echo.

:: 安裝 pnpm
echo  正在安裝 pnpm...
call npm install -g pnpm > nul 2>&1
echo  pnpm 已安裝 ...OK
echo.

:: 安裝遊戲依賴
echo  正在安裝遊戲套件（約 1-2 分鐘）...
call pnpm install
echo.
echo  安裝完成！
echo.
echo  ================================
echo   安裝成功！
echo   以後只需點兩下「開始遊戲.bat」
echo  ================================
echo.
pause
