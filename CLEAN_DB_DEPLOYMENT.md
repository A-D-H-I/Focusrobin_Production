# 🗄️ Clean Database Deployment Guide

## Overview

This deployment uses a **clean, empty database**. All tables will be created automatically by running Prisma migrations.

---

## ✅ What You Need

1. **Docker Hub Username** - To pull the app image
2. **Environment Variables** - Create `.env` file on VPS
3. **No Database Dump Needed** - Database starts fresh

---

## 🚀 Deployment Steps

### Step 1: Push App Image to Docker Hub

```bash
# On your local machine
docker login
docker tag focusrobin/app:latest YOUR_USERNAME/focusrobin-app:latest
docker push YOUR_USERNAME/focusrobin-app:latest
```

### Step 2: Setup VPS

```bash
# Connect to VPS
ssh root@72.62.116.105

# Install Docker
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install -y docker-compose-plugin
systemctl start docker
systemctl enable docker

# Create directory
mkdir -p /var/www/focusrobin
cd /var/www/focusrobin
```

### Step 3: Create docker-compose.yml

```bash
nano docker-compose.yml
```

**Paste this (update YOUR_USERNAME):**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: focusrobin_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: SUKa9599@5567
      POSTGRES_DB: focusrobin
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - focusrobin-network

  app:
    image: hariharan11111/focusrobin-app:latest
    container_name: focusrobin_app
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - DATABASE_URL=postgresql://postgres:SUKa9599@5567@postgres:5432/focusrobin?schema=public
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - focusrobin-network

networks:
  focusrobin-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

**Save:** `Ctrl+X`, `Y`, `Enter`

### Step 4: Create .env File

```bash
nano .env
```

**Add all your environment variables** (see `.env.example` for template)

**Save:** `Ctrl+X`, `Y`, `Enter`

**Secure it:**
```bash
chmod 600 .env
```

### Step 5: Start Services

```bash
# Pull image
docker compose pull

# Start containers
docker compose up -d

# Check status
docker compose ps
```

### Step 6: Run Database Migrations

**This creates all tables in the clean database:**

```bash
# Run Prisma migrations (creates all tables)
docker compose exec app npx prisma migrate deploy

# Verify tables were created
docker compose exec postgres psql -U postgres -d focusrobin -c "\dt"
```

### Step 7: (Optional) Seed Database

If you have seed data:

```bash
docker compose exec app npm run db:seed
```

---

## ✅ Verification

```bash
# Check containers
docker compose ps

# Check app logs
docker compose logs app -f

# Test database
docker compose exec postgres psql -U postgres -d focusrobin -c "SELECT COUNT(*) FROM \"User\";"

# Test application
curl http://localhost:3000
```

---

## 📝 Important Notes

1. **Clean Database**: Starts completely empty - no old data
2. **Migrations Create Schema**: All tables created by `prisma migrate deploy`
3. **No Dump File Needed**: We're starting fresh
4. **Data Persistence**: Database data stored in Docker volume `postgres_data`

---

## 🔄 If You Need to Reset Database

```bash
# Stop containers
docker compose down

# Remove database volume (⚠️ Deletes all data!)
docker volume rm focusrobinsite_postgres_data

# Start again
docker compose up -d

# Run migrations
docker compose exec app npx prisma migrate deploy
```

---

**Last Updated:** January 27, 2026

