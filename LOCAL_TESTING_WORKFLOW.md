# Local Testing Workflow

This guide helps you test everything locally before deploying to VPS.

## Quick Start

### 1. Setup Local Environment

The `.env.local` file has been created for you! It's configured to:
- Use **email/password login** (no OAuth required)
- Connect to local Docker PostgreSQL
- Use `http://localhost:3000` as base URL

**Important:** The `.env.local` file uses email/password authentication, so you don't need to configure Google or Facebook OAuth for local testing.

If you need to customize it:
```bash
# Navigate to project directory
cd G:\Dev\focusrobinsite

# Edit .env.local if needed
# The DATABASE_URL is already set for Docker networking
```

### 2. Start Local Docker Environment

```bash
# Start PostgreSQL and build/run the app
docker compose -f docker-compose.local-test.yml up -d

# Check logs
docker compose -f docker-compose.local-test.yml logs -f app
```

### 3. Setup Database (First Time Only)

**For a clean local database, use `db push` (recommended):**

```bash
# Push schema directly (creates all tables from schema.prisma)
docker compose -f docker-compose.local-test.yml exec app npx prisma@6.19.0 db push

# Then mark all migrations as applied (since schema is already created)
docker compose -f docker-compose.local-test.yml exec app npx prisma@6.19.0 migrate resolve --applied 20250111000000_make_prescription_per_user
docker compose -f docker-compose.local-test.yml exec app npx prisma@6.19.0 migrate resolve --applied 20250112000000_add_scrolling_banner
docker compose -f docker-compose.local-test.yml exec app npx prisma@6.19.0 migrate resolve --applied 20250113000000_add_navbar_settings
# ... mark all other migrations as applied
```

**Alternative: If you get migration errors, reset and use db push:**

```bash
# Reset the database (WARNING: deletes all data)
docker compose -f docker-compose.local-test.yml exec app npx prisma@6.19.0 migrate reset

# Or manually reset migrations table
docker compose -f docker-compose.local-test.yml exec postgres psql -U postgres -d focusrobin -c "DROP TABLE IF EXISTS _prisma_migrations;"

# Then push schema
docker compose -f docker-compose.local-test.yml exec app npx prisma@6.19.0 db push
```

### 3.5. Create Test Account (For Email/Password Login)

Since you're using email/password login locally, you need to create an account:

1. Go to `http://localhost:3000/register`
2. Create a new account with email and password
3. Or create one directly in the database:
   ```bash
   # Access database
   docker compose -f docker-compose.local-test.yml exec postgres psql -U postgres -d focusrobin
   
   # Then in psql, create a user (password will be hashed by the app)
   # Or use the app's registration page
   ```

### 4. Test Your Changes

1. Make code changes locally
2. Rebuild the Docker image:
   ```bash
   docker compose -f docker-compose.local-test.yml build app
   docker compose -f docker-compose.local-test.yml up -d app
   ```
3. Test at `http://localhost:3000`
4. Check logs for errors:
   ```bash
   docker compose -f docker-compose.local-test.yml logs app --tail=100
   ```

### 5. When Everything Works, Deploy to VPS

```bash
# Build and push to Docker Hub
docker build -t hariharan11111/focusrobin-app:latest .
docker push hariharan11111/focusrobin-app:latest

# Then on VPS:
# ssh root@72.62.116.105
# cd /var/www/focusrobin
# docker compose pull app
# docker compose up -d app
```

## Common Commands

```bash
# Stop local environment
docker compose -f docker-compose.local-test.yml down

# Stop and remove volumes (fresh start)
docker compose -f docker-compose.local-test.yml down -v

# Rebuild app after code changes
docker compose -f docker-compose.local-test.yml build app
docker compose -f docker-compose.local-test.yml up -d app

# View logs
docker compose -f docker-compose.local-test.yml logs app --tail=50 --follow

# Access database
docker compose -f docker-compose.local-test.yml exec postgres psql -U postgres -d focusrobin

# Run Prisma commands
docker compose -f docker-compose.local-test.yml exec app npx prisma@6.19.0 <command>
```

## Testing Try-On Page Locally

1. Make sure you have a product with TRY_ON_2D assets in the database
2. Access `http://localhost:3000/try-on`
3. Check logs for `[Try-On]` messages
4. Fix any errors locally
5. Rebuild and test again
6. Only push to VPS when it works locally

## Login Options

**Local Testing:** Uses email/password login (configured in `.env.local`)
- No OAuth setup required
- Create accounts via `/register` page
- Use email/password to login at `/login`

**Production/VPS:** Can use OAuth (Google/Facebook) or email/password
- Configure OAuth in production `.env` file
- Both login methods work simultaneously

