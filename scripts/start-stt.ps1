# Скрипт для запуска T-one STT сервиса
# PowerShell скрипт для Windows

param(
    [switch]$Build,
    [switch]$Stop,
    [switch]$Logs,
    [switch]$Status
)

$ErrorActionPreference = "Stop"

# Цвета для вывода
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ️  $message"
}

function Write-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

# Проверка Docker
function Test-Docker {
    try {
        docker --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Проверка Docker Compose
function Test-DockerCompose {
    try {
        docker-compose --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Основная логика
if (-not (Test-Docker)) {
    Write-Error "Docker не установлен или недоступен"
    exit 1
}

if (-not (Test-DockerCompose)) {
    Write-Error "Docker Compose не установлен или недоступен"
    exit 1
}

$dockerDir = Join-Path $PSScriptRoot "..\docker"
$composeFile = Join-Path $dockerDir "docker-compose.stt.yml"

if (-not (Test-Path $composeFile)) {
    Write-Error "Файл docker-compose.stt.yml не найден: $composeFile"
    exit 1
}

Set-Location $dockerDir

if ($Stop) {
    Write-Info "Остановка T-one STT сервиса..."
    docker-compose -f docker-compose.stt.yml down
    Write-Success "T-one STT сервис остановлен"
    exit 0
}

if ($Logs) {
    Write-Info "Показ логов T-one STT сервиса..."
    docker-compose -f docker-compose.stt.yml logs -f t-one-stt
    exit 0
}

if ($Status) {
    Write-Info "Статус T-one STT сервиса..."
    docker-compose -f docker-compose.stt.yml ps
    
    # Проверка здоровья
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "T-one STT сервис работает корректно"
        } else {
            Write-Warning "T-one STT сервис отвечает с кодом: $($response.StatusCode)"
        }
    } catch {
        Write-Warning "T-one STT сервис недоступен на http://localhost:8001"
    }
    exit 0
}

if ($Build) {
    Write-Info "Сборка T-one STT образа..."
    docker-compose -f docker-compose.stt.yml build --no-cache
    Write-Success "Образ собран"
}

Write-Info "Запуск T-one STT сервиса..."
docker-compose -f docker-compose.stt.yml up -d

Write-Info "Ожидание запуска сервиса..."
$maxAttempts = 30
$attempt = 0

do {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "T-one STT сервис успешно запущен и доступен на http://localhost:8001"
            Write-Info "Для просмотра логов: .\start-stt.ps1 -Logs"
            Write-Info "Для остановки: .\start-stt.ps1 -Stop"
            exit 0
        }
    } catch {
        Write-Host "." -NoNewline
    }
} while ($attempt -lt $maxAttempts)

Write-Warning "Сервис запущен, но проверка здоровья не прошла"
Write-Info "Проверьте логи: .\start-stt.ps1 -Logs"