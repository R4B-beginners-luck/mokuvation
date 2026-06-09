@echo off
chcp 65001 >nul

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

echo ========================================
echo    mokuvation 起動スクリプト
echo ========================================
echo.
echo XAMPPのApacheとMySQLが起動していることを
echo 確認してから何かキーを押してください...
pause >nul

start "mokuvation - Laravel Server" cmd /k "chcp 65001 >nul ^&^& cd /d \"%BACKEND_DIR%\" ^&^& php artisan serve"
ping -n 3 127.0.0.1 >nul
start "mokuvation - React Frontend" cmd /k "chcp 65001 >nul ^&^& cd /d \"%FRONTEND_DIR%\" ^&^& npm run dev"

echo.
echo ========================================
echo    起動完了！
echo    フロント: http://localhost:5173
echo    API:      http://localhost:8000
echo ========================================
echo.
echo このウィンドウは閉じても構いません。
pause >nul
