# 🐳 Docker Deployment Guide - FocusRobin.lt

This guide explains how to build, push to Docker Hub, and deploy the application on VPS.

---

## 📋 Prerequisites

1. **Docker Desktop** installed on your local machine
2. **Docker Hub account** (create at https://hub.docker.com)
3. **VPS with Docker and Docker Compose** installed

---

## 🏗️ Step 1: Build Docker Images Locally

### Build the Application Image

```bash
# Navigate to project directory
cd G:\Dev\focusrobinsite

# Build the Docker image
docker build -t focusrobin/app:latest .

# Verify the image was created
docker images | grep focusrobin
```

---

## 📤 Step 2: Push to Docker Hub

### Login to Docker Hub

```bash
# Login to Docker Hub (you'll be prompted for credentials)
docker login
```

**Or login with username:**
```bash
docker login -u YOUR_DOCKERHUB_USERNAME
```

### Tag and Push the Image

```bash
# Tag the image with your Docker Hub username
docker tag focusrobin/app:latest YOUR_DOCKERHUB_USERNAME/focusrobin-app:latest

# Push to Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/focusrobin-app:latest
```

**Example:**
```bash
docker tag focusrobin/app:latest hariharan/focusrobin-app:latest
docker push hariharan/focusrobin-app:latest
```

---

## 🖥️ Step 3: Deploy on VPS

### Connect to VPS

```bash
ssh root@72.62.116.105
```

### Install Docker and Docker Compose on VPS

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version

# Start Docker service
systemctl start docker
systemctl enable docker
```

### Create Deployment Directory

```bash
# Create directory for deployment
mkdir -p /var/www/focusrobin
cd /var/www/focusrobin
```

### Create docker-compose.yml on VPS

Create a `docker-compose.yml` file on the VPS:

```bash
nano docker-compose.yml
```

**Paste this content (update with your Docker Hub username):**

```yaml
version: '3.8'

services:
  # PostgreSQL Database
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

  # Next.js Application
  app:
    image: YOUR_DOCKERHUB_USERNAME/focusrobin-app:latest
    container_name: focusrobin_app
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://postgres:SUKa9599@5567@postgres:5432/focusrobin?schema=public
      # Add other environment variables here
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

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Create .env File on VPS

```bash
nano .env
```

**Add your environment variables:**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:SUKa9599@5567@postgres:5432/focusrobin?schema=public
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=https://focusrobin.lt
# Add all other required environment variables
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Pull and Start Containers

```bash
# Pull the image from Docker Hub
docker compose pull

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

---

## 🔄 Step 4: Update Application

### When you need to update:

**On Local Machine:**
```bash
# 1. Rebuild the image
docker build -t focusrobin/app:latest .

# 2. Tag with your Docker Hub username
docker tag focusrobin/app:latest YOUR_DOCKERHUB_USERNAME/focusrobin-app:latest

# 3. Push to Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/focusrobin-app:latest
```

**On VPS:**
```bash
cd /var/www/focusrobin

# Pull latest image
docker compose pull

# Restart the app container
docker compose up -d app

# Or restart all services
docker compose restart
```

---

## 🗄️ Step 5: Database Setup

### Restore Database Dump (if needed)

```bash
# Copy dump file to VPS (from local machine)
scp G:\Dev\focusrobinsite\focusrobin.dump root@72.62.116.105:/var/www/focusrobin/

# On VPS, restore the database
cd /var/www/focusrobin
docker compose exec postgres psql -U postgres -d focusrobin < focusrobin.dump
```

### Run Migrations

```bash
# Execute Prisma migrations inside the app container
docker compose exec app npx prisma migrate deploy

# Or if you have seed data
docker compose exec app npm run db:seed
```

---

## 🔍 Step 6: Verify Deployment

### Check Container Status

```bash
docker compose ps
```

### Check Application Logs

```bash
# App logs
docker compose logs app -f

# Database logs
docker compose logs postgres -f

# All logs
docker compose logs -f
```

### Test Application

```bash
# Test from VPS
curl http://localhost:3000

# Or test from browser
# Visit: https://focusrobin.lt
```

---

## 🛠️ Useful Commands

### Stop Services
```bash
docker compose down
```

### Stop and Remove Volumes (⚠️ Deletes database data)
```bash
docker compose down -v
```

### View Container Resource Usage
```bash
docker stats
```

### Access Container Shell
```bash
# App container
docker compose exec app sh

# Database container
docker compose exec postgres psql -U postgres -d focusrobin
```

### Backup Database
```bash
docker compose exec postgres pg_dump -U postgres focusrobin > backup_$(date +%Y%m%d).sql
```

---

## 🔧 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker compose logs app

# Check if port is in use
netstat -tulpn | grep 3000
```

### Database Connection Issues
```bash
# Test database connection
docker compose exec postgres psql -U postgres -d focusrobin -c "SELECT 1;"

# Check database logs
docker compose logs postgres
```

### Image Pull Issues
```bash
# Login to Docker Hub again
docker login

# Pull with verbose output
docker compose pull --verbose
```

### Permission Issues
```bash
# Fix permissions
sudo chown -R $USER:$USER /var/www/focusrobin
```

---

## 📝 Environment Variables Checklist

Make sure these are set in your `.env` file on VPS:

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL=postgresql://postgres:SUKa9599@5567@postgres:5432/focusrobin?schema=public`
- [ ] `NEXTAUTH_SECRET=your_secret`
- [ ] `NEXTAUTH_URL=https://focusrobin.lt`
- [ ] `AWS_ACCESS_KEY_ID=your_key`
- [ ] `AWS_SECRET_ACCESS_KEY=your_secret`
- [ ] `AWS_REGION=eu-central-1`
- [ ] `AWS_S3_BUCKET_NAME=focusrobin`
- [ ] `STRIPE_SECRET_KEY=your_key`
- [ ] `STRIPE_PUBLISHABLE_KEY=your_key`
- [ ] `RESEND_API_KEY=your_key`
- [ ] `GOOGLE_CLIENT_ID=your_id`
- [ ] `GOOGLE_CLIENT_SECRET=your_secret`
- [ ] `FACEBOOK_CLIENT_ID=your_id`
- [ ] `FACEBOOK_CLIENT_SECRET=your_secret`

---

## ✅ Deployment Checklist

- [ ] Docker image built locally
- [ ] Image pushed to Docker Hub
- [ ] Docker installed on VPS
- [ ] docker-compose.yml created on VPS
- [ ] .env file created with all variables
- [ ] Containers started successfully
- [ ] Database migrations run
- [ ] Application accessible on port 3000
- [ ] Nginx configured to proxy to port 3000
- [ ] SSL certificate working
- [ ] Domain accessible

---

**Last Updated:** January 27, 2026













