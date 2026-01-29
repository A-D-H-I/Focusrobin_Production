# 🚀 Complete VPS Deployment Guide

## 📋 What You Need Before Deployment

### 1. **Docker Hub Username**
- Your Docker Hub account username
- We'll push the image with tag: `YOUR_USERNAME/focusrobin-app:latest`

### 2. **Environment Variables**
- All production environment variables in a `.env` file
- **NEVER** commit this file to Git or include in Docker image

---

## 🔐 Environment Variables (.env file)

Create a `.env` file on your VPS with these variables:

```env
# Node Environment
NODE_ENV=production
PORT=3000

# Database (will be used by app container)
DATABASE_URL=postgresql://postgres:SUKa9599@5567@postgres:5432/focusrobin?schema=public

# NextAuth
NEXTAUTH_SECRET=your_secret_key_here_min_32_characters
NEXTAUTH_URL=https://focusrobin.lt

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-central-1
AWS_S3_BUCKET_NAME=focusrobin

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# PayPal (if used)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key

# OAuth - Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth - Facebook
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

# Other services (add as needed)
# GOOGLE_TRANSLATE_API_KEY=...
# DROPBOX_ACCESS_TOKEN=...
```

---

## 📦 Step 1: Push Docker Image to Docker Hub

### On Your Local Machine:

```bash
# 1. Login to Docker Hub
docker login

# 2. Tag the image (replace YOUR_USERNAME)
docker tag focusrobin/app:latest YOUR_USERNAME/focusrobin-app:latest

# 3. Push to Docker Hub
docker push YOUR_USERNAME/focusrobin-app:latest
```

---

## 🖥️ Step 2: Deploy on VPS

### Connect to VPS:
```bash
ssh root@72.62.116.105
```

### Install Docker and Docker Compose:
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

### Create Deployment Directory:
```bash
mkdir -p /var/www/focusrobin
cd /var/www/focusrobin
```

### Upload Files to VPS:

**Option A: Using SCP (from your local machine):**
```bash
# Upload docker-compose file
scp G:\Dev\focusrobinsite\docker-compose.vps.yml root@72.62.116.105:/var/www/focusrobin/docker-compose.yml
```

**Option B: Create files directly on VPS:**
```bash
# Create docker-compose.yml
nano docker-compose.yml
# (Paste content from docker-compose.vps.yml, update YOUR_DOCKERHUB_USERNAME)
```

### Create .env File on VPS:
```bash
nano .env
```

**Paste all your environment variables** (see template above).

**Save:** `Ctrl+X`, then `Y`, then `Enter`

### Update docker-compose.yml:
```bash
nano docker-compose.yml
```

**Update this line:**
```yaml
image: YOUR_DOCKERHUB_USERNAME/focusrobin-app:latest
```

**To:**
```yaml
image: your-actual-username/focusrobin-app:latest
```

**Save:** `Ctrl+X`, then `Y`, then `Enter`

---

## 🚀 Step 3: Start Everything

```bash
cd /var/www/focusrobin

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

## 🗄️ Step 4: Database Setup

**The database will start clean and empty.** Run Prisma migrations to create all tables:
```bash
# Run migrations
docker compose exec app npx prisma migrate deploy

# (Optional) Seed database if needed
docker compose exec app npm run db:seed
```

---

## ✅ Step 5: Verify Deployment

```bash
# Check containers are running
docker compose ps

# Test application
curl http://localhost:3000

# Check logs
docker compose logs app -f
docker compose logs postgres -f
```

**Visit in browser:**
- `http://72.62.116.105:3000` (or your domain if configured)

---

## 🔄 Updating the Application

When you need to update:

**On Local Machine:**
```bash
# Rebuild image
docker build -t focusrobin/app:latest .

# Tag and push
docker tag focusrobin/app:latest YOUR_USERNAME/focusrobin-app:latest
docker push YOUR_USERNAME/focusrobin-app:latest
```

**On VPS:**
```bash
cd /var/www/focusrobin

# Pull latest image
docker compose pull

# Restart app
docker compose up -d app

# Or restart all
docker compose restart
```

---

## 📁 Files Structure on VPS

```
/var/www/focusrobin/
├── docker-compose.yml      # Docker Compose configuration
├── .env                    # Environment variables (SECRET - never commit!)
└── (Docker volumes will be created automatically)
  └── postgres_data/        # PostgreSQL data (created automatically)
```

---

## 🔒 Security Notes

1. **Never commit `.env` file** to Git
2. **Never include `.env` in Docker image**
3. **Database password** is in docker-compose.yml (consider using secrets in production)
4. **Backup `.env` file** securely
5. **Restrict file permissions:**
   ```bash
   chmod 600 /var/www/focusrobin/.env
   ```

---

## 🐛 Troubleshooting

### App won't start:
```bash
# Check logs
docker compose logs app

# Check environment variables
docker compose exec app env | grep DATABASE_URL
```

### Database connection issues:
```bash
# Test database connection
docker compose exec postgres psql -U postgres -d focusrobin -c "SELECT 1;"

# Check if database exists
docker compose exec postgres psql -U postgres -l
```

### Database migrations not working:
```bash
# Check if database is accessible
docker compose exec postgres psql -U postgres -d focusrobin -c "SELECT 1;"

# Check Prisma connection
docker compose exec app npx prisma db pull

# Run migrations again
docker compose exec app npx prisma migrate deploy
```

---

## ✅ Checklist

Before going live:
- [ ] Docker image pushed to Docker Hub
- [ ] Docker and Docker Compose installed on VPS
- [ ] `docker-compose.yml` created and updated with your Docker Hub username
- [ ] `.env` file created with all production variables
- [ ] Containers started successfully
- [ ] Database migrations run (creates clean schema)
- [ ] Application accessible on port 3000
- [ ] Nginx configured to proxy to port 3000
- [ ] SSL certificate configured
- [ ] Domain pointing to VPS IP

---

**Last Updated:** January 27, 2026

