# 🚀 Deploy Now - Step by Step

## ✅ Prerequisites Ready
- ✅ Docker installed (29.2.0)
- ✅ Docker Compose installed (v5.0.2)
- ✅ Docker image pushed to Docker Hub

---

## Step 1: Create Deployment Directory

```bash
mkdir -p /var/www/focusrobin
cd /var/www/focusrobin
```

---

## Step 2: Create docker-compose.yml

```bash
nano docker-compose.yml
```

**Paste this content:**

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

---

## Step 3: Create .env File

```bash
nano .env
```

**Paste your environment variables** (copy from your local .env file, but make sure DATABASE_URL is):

```env
DATABASE_URL=postgresql://postgres:SUKa9599@5567@postgres:5432/focusrobin?schema=public
```

**Important:** 
- Hostname must be `postgres` (not localhost)
- Password must be `SUKa9599@5567`
- Add all your other environment variables (Stripe, AWS, OAuth, etc.)

**Save:** `Ctrl+X`, `Y`, `Enter`

**Secure it:**
```bash
chmod 600 .env
```

---

## Step 4: Start Everything

```bash
# Pull the Docker image
docker compose pull

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

---

## Step 5: Run Database Migrations

```bash
# Create all database tables
docker compose exec app npx prisma migrate deploy

# Verify tables were created
docker compose exec postgres psql -U postgres -d focusrobin -c "\dt"
```

---

## Step 6: Verify Deployment

```bash
# Test application
curl http://localhost:3000

# Check logs
docker compose logs app --tail 50
```

---

## ✅ Success!

If everything works, your application will be running on:
- **Internal:** http://localhost:3000
- **External:** http://72.62.116.105:3000 (or your domain if configured)

---

## 🔍 Troubleshooting

**If containers won't start:**
```bash
docker compose logs
docker compose ps
```

**If database connection fails:**
```bash
docker compose exec postgres psql -U postgres -d focusrobin -c "SELECT 1;"
```

**If app has errors:**
```bash
docker compose logs app -f
```

---

**Ready to deploy!** 🚀












