# PowerShell script to test locally
# Usage: .\test-local.ps1

Write-Host "=== Local Testing Workflow ===" -ForegroundColor Cyan

# Step 1: Build and start
Write-Host "`n[1/3] Building and starting containers..." -ForegroundColor Yellow
docker compose -f docker-compose.local-test.yml up -d --build

# Step 2: Wait for services to be ready
Write-Host "`n[2/3] Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 3: Check status
Write-Host "`n[3/3] Checking container status..." -ForegroundColor Yellow
docker compose -f docker-compose.local-test.yml ps

Write-Host "`n✅ Local environment is running!" -ForegroundColor Green
Write-Host "   - App: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   - View logs: docker compose -f docker-compose.local-test.yml logs -f app" -ForegroundColor Cyan
Write-Host "   - Stop: docker compose -f docker-compose.local-test.yml down" -ForegroundColor Cyan













