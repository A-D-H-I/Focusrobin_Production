# Fix Local Database Migration Error
# This script resets the migration state and uses db push for a clean database

Write-Host "=== Fixing Local Database ===" -ForegroundColor Cyan

# Step 1: Check if containers are running
Write-Host "`n[1/4] Checking containers..." -ForegroundColor Yellow
$containers = docker compose -f docker-compose.local-test.yml ps -q
if (-not $containers) {
    Write-Host "❌ Containers are not running. Start them first:" -ForegroundColor Red
    Write-Host "   docker compose -f docker-compose.local-test.yml up -d" -ForegroundColor Cyan
    exit 1
}

# Step 2: Drop the migrations table to reset migration state
Write-Host "`n[2/4] Resetting migration state..." -ForegroundColor Yellow
docker compose -f docker-compose.local-test.yml exec postgres psql -U postgres -d focusrobin -c "DROP TABLE IF EXISTS _prisma_migrations;" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration table dropped" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not drop migration table (might not exist yet)" -ForegroundColor Yellow
}

# Step 3: Push schema directly
Write-Host "`n[3/4] Pushing schema to database..." -ForegroundColor Yellow
docker compose -f docker-compose.local-test.yml exec app npx prisma@6.19.0 db push --accept-data-loss

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema pushed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Schema push failed" -ForegroundColor Red
    exit 1
}

# Step 4: Mark all migrations as applied
Write-Host "`n[4/4] Marking migrations as applied..." -ForegroundColor Yellow

# Get list of migrations
$migrations = @(
    "20250111000000_make_prescription_per_user",
    "20250112000000_add_scrolling_banner",
    "20250113000000_add_navbar_settings"
)

# Try to get all migrations from the migrations folder
$migrationFiles = Get-ChildItem -Path "prisma\migrations" -Directory -ErrorAction SilentlyContinue
if ($migrationFiles) {
    $migrations = $migrationFiles | ForEach-Object { $_.Name }
}

foreach ($migration in $migrations) {
    Write-Host "   Marking $migration as applied..." -ForegroundColor Gray
    docker compose -f docker-compose.local-test.yml exec app npx prisma@6.19.0 migrate resolve --applied $migration 2>&1 | Out-Null
}

Write-Host "`n✅ Database setup complete!" -ForegroundColor Green
Write-Host "`nYou can now:" -ForegroundColor Cyan
Write-Host "   - Access the app at http://localhost:3000" -ForegroundColor White
Write-Host "   - Create an account at http://localhost:3000/register" -ForegroundColor White
Write-Host "   - View logs: docker compose -f docker-compose.local-test.yml logs -f app" -ForegroundColor White










