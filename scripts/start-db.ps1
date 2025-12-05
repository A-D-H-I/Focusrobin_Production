# PowerShell script to start PostgreSQL database
Write-Host "Checking Docker Desktop..." -ForegroundColor Yellow

# Check if Docker is running
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please:" -ForegroundColor Yellow
        Write-Host "1. Start Docker Desktop application" -ForegroundColor Cyan
        Write-Host "2. Wait for it to fully start (whale icon in system tray)" -ForegroundColor Cyan
        Write-Host "3. Run this script again or run: docker-compose up -d postgres" -ForegroundColor Cyan
        exit 1
    }
    
    Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
    Write-Host ""
    
    # Check if container exists
    $container = docker ps -a --filter "name=focusrobin_db" --format "{{.Names}}"
    
    if ($container -eq "focusrobin_db") {
        Write-Host "Container exists, checking status..." -ForegroundColor Yellow
        $status = docker ps --filter "name=focusrobin_db" --format "{{.Status}}"
        
        if ($status) {
            Write-Host "✅ Database container is already running" -ForegroundColor Green
            Write-Host "Status: $status" -ForegroundColor Cyan
        } else {
            Write-Host "Starting existing container..." -ForegroundColor Yellow
            docker start focusrobin_db
            Start-Sleep -Seconds 3
            Write-Host "✅ Database container started" -ForegroundColor Green
        }
    } else {
        Write-Host "Creating and starting database container..." -ForegroundColor Yellow
        docker-compose up -d postgres
        Start-Sleep -Seconds 5
        Write-Host "✅ Database container created and started" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            $result = docker exec focusrobin_db pg_isready -U myuser 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Database is ready!" -ForegroundColor Green
                Write-Host ""
                Write-Host "You can now run:" -ForegroundColor Cyan
                Write-Host "  npx prisma migrate dev --name add_currency_rate" -ForegroundColor White
                exit 0
            }
        } catch {
            # Continue waiting
        }
        
        $attempt++
        Start-Sleep -Seconds 1
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "⚠️  Database took too long to start. Please check manually." -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

