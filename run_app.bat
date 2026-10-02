@echo off
title N5 Flashcard App
color 0B

echo ===================================================
echo             N5 FLASHCARD APP - PC VERSION
echo ===================================================
echo.

:: Kiem tra xem Node.js da duoc cai chua
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [LOI] May tinh cua ban chua cai dat Node.js!
    echo.
    echo 1. Vui long tai va cai dat Node.js tai: https://nodejs.org/ 
    echo 2. Chon phien ban Recommended For Most Users - LTS.
    echo 3. Sau khi cai dat xong, hay chay lai file run_app.bat nay.
    echo.
    pause
    exit /b
)

echo [OK] Da tim thay Node.js.
echo.
echo Dang kiem tra va cai dat cac thu vien can thiet...
echo (Viec nay co the mat vai chuc giay neu day la lan chay dau tien)
call npm install --no-fund --no-audit

echo.
echo ===================================================
echo [XONG] Dang khoi dong ung dung...
echo Ung dung se tu dong mo len tren trinh duyet cua ban!
echo ===================================================
echo.

:: Chay dev server va tu dong mo browser
call npm run dev -- --open

pause
