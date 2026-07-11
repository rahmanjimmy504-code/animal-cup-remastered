@echo off
chcp 65001 > nul
title Animal Cup

cd /d "%~dp0"

:: 如果已經在執行，直接開瀏覽器
netstat -an | find ":13000" | find "LISTENING" > nul
if not errorlevel 1 (
    echo 遊戲已在執行，正在開啟瀏覽器...
    start "" "http://localhost:13000"
    goto end
)

echo.
echo  ================================
echo   Animal Cup 啟動中，請稍候...
echo  ================================
echo.

start "Animal Cup Server" /min cmd /k "pnpm dev:lan"

:wait
timeout /t 2 /nobreak > nul
netstat -an | find ":13000" | find "LISTENING" > nul
if errorlevel 1 goto wait

timeout /t 1 /nobreak > nul
start "" "http://localhost:13000"

echo  遊戲已啟動！瀏覽器已自動開啟。
echo.
echo  手機加入：連同一個 Wi-Fi，掃大廳的 QR Code 即可。
echo.
echo  要關閉遊戲請執行「關閉遊戲.bat」
echo.

:end
pause
