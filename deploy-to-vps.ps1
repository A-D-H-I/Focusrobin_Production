# PowerShell script to deploy to VPS
# Usage: .\deploy-to-vps.ps1

Write-Host "=== Deploy to VPS Workflow ===" -ForegroundColor Cyan

# Step 1: Build
Write-Host "`n[1/4] Building Docker image..." -ForegroundColor Yellow
docker build -t hariharan11111/focusrobin-app:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Push to Docker Hub
Write-Host "`n[2/4] Pushing to Docker Hub..." -ForegroundColor Yellow
docker push hariharan11111/focusrobin-app:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed! Make sure you're logged in: docker login" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/4] Image pushed successfully!" -ForegroundColor Green
Write-Host "`n[4/4] Now run these commands on your VPS:" -ForegroundColor Yellow
Write-Host "   ssh root@72.62.116.105" -ForegroundColor Cyan
Write-Host "   cd /var/www/focusrobin" -ForegroundColor Cyan
Write-Host "   docker compose pull app" -ForegroundColor Cyan
Write-Host "   docker compose up -d app" -ForegroundColor Cyan
Write-Host "   docker compose logs app --tail=50 --follow" -ForegroundColor Cyan










