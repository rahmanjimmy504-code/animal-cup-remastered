@echo off
chcp 65001 > nul
title Animal Cup - 關閉中

echo.
echo  正在關閉 Animal Cup...
taskkill /f /im node.exe > nul 2>&1
echo  已關閉。
echo.
pause
