# Taskiro Deployment Script for Windows
param(
    [switch]$SkipTests = $false
)

Write-Host "🚀 Starting Taskiro deployment..." -ForegroundColor Green

# Validate environment variables
Write-Host "🔍 Validating environment..." -ForegroundColor Blue
node scripts/validate-env.js
if ($LASTEXITCODE -ne 0) {
    exit 1
}

# Create logs directory
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

try {
    # Build the application
    Write-Host "📦 Building application..." -ForegroundColor Blue
    if ($SkipTests) {
        npm run build
        npm run server:build
    } else {
        npm run build:prod
    }

    # Build Docker image
    Write-Host "🐳 Building Docker image..." -ForegroundColor Blue
    docker build -t taskiro:latest .

    # Stop existing containers
    Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml down 2>$null

    # Start new containers
    Write-Host "🚀 Starting new containers..." -ForegroundColor Green
    docker-compose -f docker-compose.prod.yml up -d

    # Wait for services to be ready
    Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10

    # Run database migrations
    Write-Host "🗄️ Running database migrations..." -ForegroundColor Blue
    docker-compose -f docker-compose.prod.yml exec -T app npm run db:migrate:prod

    # Health check
    Write-Host "🏥 Performing health check..." -ForegroundColor Blue
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Deployment successful! Application is running at http://localhost" -ForegroundColor Green
        } else {
            throw "Health check returned status code: $($response.StatusCode)"
        }
    } catch {
        Write-Host "❌ Health check failed. Check logs:" -ForegroundColor Red
        docker-compose -f docker-compose.prod.yml logs app
        exit 1
    }

    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}