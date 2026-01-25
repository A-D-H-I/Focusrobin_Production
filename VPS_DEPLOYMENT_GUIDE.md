# 🚀 FocusRobin VPS Deployment Guide
**Complete Step-by-Step Guide for Hostinger Ubuntu VPS**

---

## 📋 Table of Contents

1. [VPS Tech Stack Recommendation](#1-vps-tech-stack-recommendation)
2. [Next.js Configuration](#2-nextjs-configuration)
3. [Step-by-Step Deployment](#3-step-by-step-deployment)
4. [Nginx Configuration](#4-nginx-configuration)
5. [PM2 Process Manager](#5-pm2-process-manager)
6. [SSL Certificate Setup](#6-ssl-certificate-setup)
7. [Firewall Configuration](#7-firewall-configuration)
8. [Post-Deployment Verification](#8-post-deployment-verification)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. VPS Tech Stack Recommendation

### ✅ **Recommended Stack for MVP**

#### **Database: PostgreSQL (Dockerized) - RECOMMENDED**

**Why PostgreSQL over SQLite:**
- ✅ **Production-Ready:** Handles concurrent connections (multiple users shopping simultaneously)
- ✅ **ACID Compliance:** Ensures data integrity for orders and payments
- ✅ **Scalability:** Can handle growth from MVP to thousands of products
- ✅ **Your Project Already Uses It:** Your Prisma schema is configured for PostgreSQL

**Why Dockerized:**
- ✅ **Easy Setup:** One command to start/stop database
- ✅ **Isolated:** Doesn't interfere with system packages
- ✅ **Portable:** Easy to backup and migrate
- ✅ **Version Control:** Consistent database version across environments

#### **Alternative: SQLite (Only for Testing)**

SQLite is **NOT recommended** for production e-commerce because:
- ❌ **Concurrent Write Limitations:** Only one write at a time (orders will fail under load)
- ❌ **No Network Access:** Can't scale to multiple servers
- ❌ **Limited Features:** Missing advanced features needed for e-commerce

**Use SQLite ONLY if:**
- You're testing locally
- You have < 10 products
- You have < 5 concurrent users
- You're okay with potential data loss

### 🎯 **Final Recommendation: PostgreSQL + Docker**

**Stack:**
- **Framework:** Next.js 15 (App Router) ✅
- **Database:** PostgreSQL 15+ (Docker) ✅
- **Reverse Proxy:** Nginx ✅
- **Process Manager:** PM2 ✅
- **SSL:** Certbot (Let's Encrypt) ✅
- **Firewall:** UFW ✅

---

## 2. Next.js Configuration

### ✅ **Already Updated: `next.config.ts`**

Your `next.config.ts` now includes:
- ✅ `output: 'standalone'` - Creates minimal server bundle
- ✅ Cache-Control headers for optimal performance
- ✅ Security headers (HSTS, CSP, etc.)

### ✅ **Updated: `package.json` Scripts**

New scripts added:
```json
{
  "start:standalone": "node .next/standalone/server.js",
  "postinstall": "prisma generate",
  "db:migrate": "prisma migrate deploy",
  "db:seed": "tsx prisma/seed.ts"
}
```

---

## 3. Step-by-Step Deployment

### **Prerequisites:**
- Hostinger VPS with Ubuntu 22.04 LTS (or 20.04)
- SSH access to your VPS
- Domain name pointing to your VPS IP (for SSL)

### **Step 1: Connect to Your VPS**

```bash
# From your local machine
ssh root@your-vps-ip
# Or if you have a username:
ssh your-username@your-vps-ip
```

### **Step 2: Update System Packages**

```bash
# Update package list
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

### **Step 3: Install Node.js 20.x (LTS)**

```bash
# Install Node.js using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### **Step 4: Install Docker & Docker Compose**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (replace 'your-username' with your actual username)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
# Then SSH back in
```

### **Step 5: Set Up PostgreSQL with Docker**

```bash
# Create directory for database
mkdir -p ~/focusrobin-db
cd ~/focusrobin-db

# Create docker-compose.yml for PostgreSQL
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: focusrobin_postgres
    restart: always
    environment:
      POSTGRES_USER: focusrobin
      POSTGRES_PASSWORD: YOUR_SECURE_PASSWORD_HERE
      POSTGRES_DB: focusrobin_prod
    ports:
      - "127.0.0.1:5432:5432"  # Only accessible from localhost
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U focusrobin"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
EOF

# IMPORTANT: Replace YOUR_SECURE_PASSWORD_HERE with a strong password
# Use a password generator: openssl rand -base64 32
nano docker-compose.yml
# Edit the POSTGRES_PASSWORD line, save and exit (Ctrl+X, Y, Enter)

# Start PostgreSQL
docker-compose up -d

# Verify it's running
docker ps
# You should see focusrobin_postgres container

# Test connection (optional)
docker exec -it focusrobin_postgres psql -U focusrobin -d focusrobin_prod
# Type \q to exit
```

### **Step 6: Install PM2 (Process Manager)**

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### **Step 7: Install Nginx**

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### **Step 8: Clone Your Repository**

```bash
# Create app directory
mkdir -p ~/apps
cd ~/apps

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/your-username/focusrobin.git
# OR if using SSH:
# git clone git@github.com:your-username/focusrobin.git

cd focusrobin
```

### **Step 9: Set Up Environment Variables**

```bash
# Create .env.production file
nano .env.production
```

**Add these variables (replace with your actual values):**

```env
# Database (use the password you set in docker-compose.yml)
DATABASE_URL="postgresql://focusrobin:YOUR_SECURE_PASSWORD_HERE@localhost:5432/focusrobin_prod?schema=public"

# NextAuth
NEXTAUTH_URL="https://focusrobin.com"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# Node Environment
NODE_ENV="production"

# Stripe (get from Stripe Dashboard)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email (Resend)
RESEND_API_KEY="re_..."

# Optional: Analytics
NEXT_PUBLIC_GA_ID="G-..."
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### **Step 10: Install Dependencies & Build**

```bash
# Install dependencies
npm install --production=false

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed database with initial data
npm run db:seed

# Build the application
npm run build

# Verify standalone output exists
ls -la .next/standalone/
```

### **Step 11: Configure PM2**

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'focusrobin',
    script: 'node .next/standalone/server.js',
    cwd: '/home/your-username/apps/focusrobin',  // Update with your actual path
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Update the path in ecosystem.config.js
nano ecosystem.config.js
# Change /home/your-username/apps/focusrobin to your actual path
# Get your path with: pwd

# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Run the command it outputs (usually something like: sudo env PATH=...)

# Check status
pm2 status
pm2 logs focusrobin
```

### **Step 12: Configure Nginx (Reverse Proxy)**

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/focusrobin
```

**Add this configuration (replace `focusrobin.com` with your domain):**

```nginx
# Upstream to Next.js server
upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name focusrobin.com www.focusrobin.com;

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name focusrobin.com www.focusrobin.com;

    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/focusrobin.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/focusrobin.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Increase body size for file uploads
    client_max_body_size 10M;

    # Proxy to Next.js
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location /_next/static/ {
        proxy_pass http://nextjs;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    # Cache images
    location /_next/image {
        proxy_pass http://nextjs;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/focusrobin /etc/nginx/sites-enabled/

# Remove default Nginx site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### **Step 13: Install Certbot (SSL Certificate)**

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (replace with your domain and email)
sudo certbot --nginx -d focusrobin.com -d www.focusrobin.com --email your-email@example.com --agree-tos --non-interactive

# Test auto-renewal
sudo certbot renew --dry-run

# Certbot automatically updates Nginx config with SSL certificates
# Reload Nginx to apply changes
sudo systemctl reload nginx
```

### **Step 14: Configure Firewall (UFW)**

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Check status
sudo ufw status

# You should see:
# Status: active
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
```

---

## 4. Nginx Configuration (Detailed)

The Nginx configuration above includes:
- ✅ **Reverse Proxy:** Routes traffic to Next.js on port 3000
- ✅ **SSL/TLS:** Secure HTTPS connections
- ✅ **Gzip Compression:** Reduces bandwidth usage
- ✅ **Caching:** Static assets cached for 1 year
- ✅ **Security Headers:** X-Frame-Options, CSP, etc.

---

## 5. PM2 Process Manager

PM2 ensures your app:
- ✅ **Auto-restarts** if it crashes
- ✅ **Starts on boot** (after server reboot)
- ✅ **Logs management** (error and output logs)
- ✅ **Zero-downtime** restarts (with multiple instances)

**Useful PM2 Commands:**
```bash
pm2 status              # Check app status
pm2 logs focusrobin     # View logs
pm2 restart focusrobin   # Restart app
pm2 stop focusrobin     # Stop app
pm2 delete focusrobin    # Remove from PM2
pm2 monit               # Monitor in real-time
```

---

## 6. SSL Certificate Setup

Certbot automatically:
- ✅ Obtains SSL certificate from Let's Encrypt
- ✅ Configures Nginx with SSL
- ✅ Sets up auto-renewal (certificates expire every 90 days)

**Manual Renewal (if needed):**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## 7. Firewall Configuration

UFW (Uncomplicated Firewall) protects your server:
- ✅ **SSH (22):** Allows you to connect
- ✅ **HTTP (80):** Allows Let's Encrypt verification
- ✅ **HTTPS (443):** Allows secure web traffic
- ❌ **All other ports:** Blocked by default

---

## 8. Post-Deployment Verification

### **Check 1: Application is Running**

```bash
# Check PM2 status
pm2 status

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000

# Check application logs
pm2 logs focusrobin --lines 50
```

### **Check 2: Nginx is Working**

```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### **Check 3: Database is Running**

```bash
# Check Docker containers
docker ps

# Test database connection
docker exec -it focusrobin_postgres psql -U focusrobin -d focusrobin_prod -c "SELECT version();"
```

### **Check 4: Website is Accessible**

```bash
# Test locally (from VPS)
curl http://localhost:3000

# Test through Nginx
curl https://focusrobin.com

# Check SSL certificate
curl -I https://focusrobin.com
```

### **Check 5: SEO & SSR Verification**

```bash
# Test if HTML is server-rendered (should show full HTML, not just <div id="root">)
curl https://focusrobin.com | head -20

# Test sitemap
curl https://focusrobin.com/sitemap.xml

# Test robots.txt
curl https://focusrobin.com/robots.txt
```

### **Check 6: Google Search Console**

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property: `https://focusrobin.com`
3. Verify ownership (DNS or HTML file)
4. Submit sitemap: `https://focusrobin.com/sitemap.xml`
5. Request indexing for key pages

---

## 9. Troubleshooting

### **Problem: Application won't start**

```bash
# Check PM2 logs
pm2 logs focusrobin --err

# Check if port 3000 is already in use
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>

# Restart PM2
pm2 restart focusrobin
```

### **Problem: Database connection error**

```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs focusrobin_postgres

# Restart PostgreSQL
cd ~/focusrobin-db
docker-compose restart

# Test connection
docker exec -it focusrobin_postgres psql -U focusrobin -d focusrobin_prod
```

### **Problem: Nginx 502 Bad Gateway**

```bash
# Check if Next.js is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Next.js directly
curl http://localhost:3000

# Restart Next.js
pm2 restart focusrobin
```

### **Problem: SSL certificate issues**

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

### **Problem: Can't access website**

```bash
# Check firewall
sudo ufw status

# Check if ports are open
sudo netstat -tlnp | grep -E ':(80|443)'

# Check DNS (from your local machine)
nslookup focusrobin.com
```

---

## 🔄 **Updating Your Application**

When you make changes to your code:

```bash
# SSH into your VPS
ssh your-username@your-vps-ip

# Navigate to app directory
cd ~/apps/focusrobin

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install

# Generate Prisma Client (if schema changed)
npx prisma generate

# Run migrations (if database schema changed)
npx prisma migrate deploy

# Rebuild application
npm run build

# Restart application
pm2 restart focusrobin

# Check logs
pm2 logs focusrobin
```

---

## 📊 **Monitoring & Maintenance**

### **Daily Checks:**
- Check PM2 status: `pm2 status`
- Check disk space: `df -h`
- Check memory: `free -h`

### **Weekly Checks:**
- Check application logs: `pm2 logs focusrobin --lines 100`
- Check Nginx logs: `sudo tail -100 /var/log/nginx/error.log`
- Check database size: `docker exec focusrobin_postgres psql -U focusrobin -d focusrobin_prod -c "SELECT pg_size_pretty(pg_database_size('focusrobin_prod'));"`

### **Monthly Checks:**
- Update system packages: `sudo apt update && sudo apt upgrade -y`
- Update Node.js if needed
- Review and rotate secrets if needed

---

## ✅ **Summary**

Your VPS is now configured with:
- ✅ Next.js running on port 3000 (PM2)
- ✅ PostgreSQL in Docker
- ✅ Nginx reverse proxy with SSL
- ✅ Firewall configured
- ✅ Auto-restart on crash
- ✅ Auto-start on boot

**Your site is now live and ready for Google to crawl!** 🎉

---

## 🆘 **Need Help?**

Common issues and solutions are in the Troubleshooting section above. For additional help:
- Check PM2 logs: `pm2 logs focusrobin`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check system logs: `journalctl -u nginx -f`










