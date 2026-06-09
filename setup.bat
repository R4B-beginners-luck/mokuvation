@echo off
chcp 65001 >nul

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

echo ========================================
echo    mokuvation 初回セットアップ
echo ========================================
echo.
echo [1/3] backend: .env を準備
cd /d "%BACKEND_DIR%"
if not exist ".env" (
    if exist ".env.example" (
        copy "/Y" ".env.example" ".env" >nul
        echo .env を作成しました
        echo .env が作成されたため、Laravel のアプリキーを生成します
        php artisan key:generate --ansi
        if errorlevel 1 (
            echo.
            echo [ERROR] php artisan key:generate に失敗しました。
            pause
            exit /b 1
        )
    ) else (
        echo [WARN] backend\.env.example が見つかりません。
    )
)
echo.
echo [2/3] backend: composer install
composer install
if errorlevel 1 (
    echo.
    echo [ERROR] composer install に失敗しました。
    pause
    exit /b 1
)
echo.
echo [3/3] frontend: npm install
cd /d "%FRONTEND_DIR%"
npm install
if errorlevel 1 (
    echo.
    echo [ERROR] npm install に失敗しました。
    pause
    exit /b 1
)
echo.
echo ========================================
echo    セットアップが完了しました。
echo ========================================
echo.
pause
