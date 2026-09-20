@echo off
chcp 65001 > nul
title Animal Cup - 關閉中

echo.
echo  正在關閉 Animal Cup...

:: Only kill the game's own console window ("Animal Cup Server", started by
:: 開始遊戲.bat) and its process tree. NEVER `taskkill /f /im node.exe` —
:: that would kill EVERY Node.js process on this computer.
taskkill /f /t /fi "WINDOWTITLE eq Animal Cup Server*" > nul 2>&1
if errorlevel 1 (
    echo  找不到遊戲窗口，可能已經關閉了。
) else (
    echo  已關閉。
)
echo.
pause
