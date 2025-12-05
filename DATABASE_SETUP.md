# Database Setup Instructions

## Error: Can't reach database server at `localhost:5432`

This error occurs because PostgreSQL is not running. The project uses Docker Compose to run PostgreSQL.

## Solution

### Option 1: Start Docker Desktop (Recommended)

1. **Start Docker Desktop**
   - Open Docker Desktop application on Windows
   - Wait for it to fully start (you'll see a whale icon in the system tray)
   - The status should show "Docker Desktop is running"

2. **Start the database container**
   ```powershell
   # Run the helper script
   .\scripts\start-db.ps1
   
   # OR manually:
   docker-compose up -d postgres
   ```

3. **Verify database is running**
   ```powershell
   docker ps
   ```
   You should see `focusrobin_db` container running.

4. **Run the migration**
   ```powershell
   npx prisma migrate dev --name add_currency_rate
   ```

5. **Seed the database**
   ```powershell
   npx prisma db seed
   ```

### Option 2: Use an Existing PostgreSQL Server

If you have PostgreSQL installed locally or want to use a different database:

1. **Update your `.env` file** (create one if it doesn't exist):
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/focusrobin_local?schema=public"
   ```

2. **Create the database** (if it doesn't exist):
   ```sql
   CREATE DATABASE focusrobin_local;
   ```

3. **Run the migration**:
   ```powershell
   npx prisma migrate dev --name add_currency_rate
   ```

### Option 3: Use a Cloud Database

If you're using a cloud database (e.g., Supabase, Railway, Neon):

1. **Update your `.env` file** with your connection string:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   ```

2. **Run the migration**:
   ```powershell
   npx prisma migrate dev --name add_currency_rate
   ```

## Troubleshooting

### Docker Desktop won't start
- Make sure virtualization is enabled in BIOS
- Check Windows WSL 2 is installed and updated
- Restart your computer

### Port 5432 already in use
If you have another PostgreSQL instance running:
```powershell
# Stop the existing container
docker stop focusrobin_db

# Or change the port in docker-compose.yml
# Edit: ports: - "5433:5432" (use 5433 instead)
```

### Connection timeout
- Check firewall settings
- Verify Docker Desktop is fully started
- Try restarting Docker Desktop

## Quick Start (After Docker is Running)

```powershell
# 1. Start database
docker-compose up -d postgres

# 2. Wait a few seconds for DB to initialize

# 3. Run migration
npx prisma migrate dev --name add_currency_rate

# 4. Seed currency rates
npx prisma db seed
```

## Verify Setup

After setup, you can verify the currency rates were seeded:

```powershell
# Connect to database
docker exec -it focusrobin_db psql -U myuser -d focusrobin_local

# Query currency rates
SELECT code, rate, symbol, name FROM "CurrencyRate";

# Exit
\q
```

