@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  Surge 로 무료 주소 만들기 (방문자 비밀번호 없음)
echo  처음 한 번만 이메일 입력합니다.
echo.
npx --yes surge . --domain heaven-clock-%RANDOM%.surge.sh
echo.
pause
