# ✅ Ready for VPS Deployment!

## 🎉 What's Done

1. ✅ **Docker Image Pushed to Docker Hub**
   - Repository: `hariharan11111/focusrobin-app:latest`
   - Status: Successfully pushed
   - Digest: `sha256:87a62fac752d5c8d01a2325c307ffc5a7f7ea6c6ec2e5cd4f32ea22ecfbf9bc2`

2. ✅ **Docker Compose File Ready**
   - File: `docker-compose.vps.yml`
   - Already configured with your Docker Hub username
   - Database credentials set

3. ✅ **Clean Database Setup**
   - Fresh database (no dump needed)
   - Migrations will create all tables

---

## 📋 Next Steps: Deploy on VPS

### Step 1: Connect to VPS

```bash
ssh root@72.62.116.105
```

### Step 2: Install Docker & Docker Compose

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Start Docker
systemctl start docker
systemctl enable docker

# Verify
docker --version
docker compose version
```

### Step 3: Create Deployment Directory

```bash
mkdir -p /var/www/focusrobin
cd /var/www/focusrobin
```

### Step 4: Upload docker-compose.yml

**From your local machine (PowerShell):**

```powershell
scp G:\Dev\focusrobinsite\docker-compose.vps.yml root@72.62.116.105:/var/www/focusrobin/docker-compose.yml
```

**Or create it directly on VPS:**

```bash
nano docker-compose.yml
```

**Paste the content from `docker-compose.vps.yml`** (it's already configured with your username)

### Step 5: Create .env File on VPS

```bash
nano .env
```

**Important:** Copy your `.env` file content BUT update the DATABASE_URL:

**Change this (if you have localhost):**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/focusrobin?schema=public
```

**To this (for Docker):**
```
DATABASE_URL=postgresql://postgres:SUKa9599@5567@postgres:5432/focusrobin?schema=public
```

**Key changes:**
- Hostname: `localhost` → `postgres` (Docker service name)
- Password: Use `SUKa9599@5567` (matches docker-compose.yml)
- Username: `postgres`

**Save:** `Ctrl+X`, `Y`, `Enter`

**Secure it:**
```bash
chmod 600 .env
```

### Step 6: Start Everything

```bash
# Pull the image
docker compose pull

# Start containers
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 7: Run Database Migrations

```bash
# Create all database tables
docker compose exec app npx prisma migrate deploy

# Verify tables were created
docker compose exec postgres psql -U postgres -d focusrobin -c "\dt"
```

### Step 8: Verify Deployment

```bash
# Test application
curl http://localhost:3000

# Check if it's working
docker compose logs app --tail 50
```

---

## 🔑 Database Connection Details

**For your .env file on VPS, use:**

```env
DATABASE_URL=postgresql://postgres:SUKa9599@5567@postgres:5432/focusrobin?schema=public
```

**Breakdown:**
- Username: `postgres`
- Password: `SUKa9599@5567`
- Host: `postgres` (Docker service name, NOT localhost)
- Port: `5432`
- Database: `focusrobin`

---

## 📝 Checklist

- [ ] Docker installed on VPS
- [ ] docker-compose.yml uploaded/created
- [ ] .env file created with correct DATABASE_URL
- [ ] Image pulled from Docker Hub
- [ ] Containers started
- [ ] Migrations run
- [ ] Application accessible

---

## 🚀 Your Image is Ready!

**Docker Hub:** https://hub.docker.com/r/hariharan11111/focusrobin-app

You can now deploy on your VPS!

---

**Last Updated:** January 27, 2026

