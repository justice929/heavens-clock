$ErrorActionPreference = "SilentlyContinue"
Set-Location -LiteralPath $PSScriptRoot

$port = 8765

$ip = (
  Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*"
  } |
  Select-Object -First 1
).IPAddress

if (-not $ip) { $ip = "127.0.0.1" }

$url = "http://${ip}:${port}/"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       천국의 시계 - 핸드폰 접속" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1) PC와 핸드폰이 같은 Wi-Fi인지 확인" -ForegroundColor Yellow
Write-Host "  2) 핸드폰 Chrome 또는 Safari 주소창에 입력:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  $url" -ForegroundColor Black -BackgroundColor Green
Write-Host ""
Write-Host "  (이 창을 닫으면 핸드폰에서도 접속이 끊깁니다)" -ForegroundColor DarkGray
Write-Host ""

$started = $false

if (Get-Command python -ErrorAction SilentlyContinue) {
  Write-Host "서버 시작 중 (Python)..." -ForegroundColor Gray
  python -m http.server $port --bind 0.0.0.0
  $started = $true
}

if (-not $started -and (Get-Command py -ErrorAction SilentlyContinue)) {
  Write-Host "서버 시작 중 (py)..." -ForegroundColor Gray
  py -m http.server $port --bind 0.0.0.0
  $started = $true
}

if (-not $started) {
  Write-Host "Python이 설치되어 있지 않습니다." -ForegroundColor Red
  Write-Host ""
  Write-Host "해결 방법:" -ForegroundColor Yellow
  Write-Host "  A) https://www.python.org 에서 Python 설치 후 이 파일 다시 실행"
  Write-Host "  B) index.html 을 카카오톡 '나와의 채팅'으로 보낸 뒤"
  Write-Host "     핸드폰에서 받은 파일 -> '다른 앱으로 열기' -> Chrome"
  Write-Host ""
  Read-Host "Enter 키를 누르면 종료"
}
