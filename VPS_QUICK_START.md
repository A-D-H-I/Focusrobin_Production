# 🚀 VPS Quick Start Guide

## Quick Reference Commands

### Initial Setup (One-Time)

```bash
# 1. Connect to VPS
ssh your-username@your-vps-ip

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in

# 4. Install PM2
sudo npm install -g pm2

# 5. Install Nginx
sudo apt install -y nginx

# 6. Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### Database Setup

```bash
# Create database directory
mkdir -p ~/focusrobin-db
cd ~/focusrobin-db

# Copy docker-compose.prod.yml and update password
nano docker-compose.yml
# Update POSTGRES_PASSWORD

# Start PostgreSQL
docker-compose up -d

# Verify
docker ps
```

### Application Deployment

```bash
# Clone repository
cd ~/apps
git clone your-repo-url focusrobin
cd focusrobin

# Create .env.production
nano .env.production
# Add all environment variables

# Install and build
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx & SSL

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/focusrobin
# Copy config from VPS_DEPLOYMENT_GUIDE.md

# Enable site
sudo ln -s /etc/nginx/sites-available/focusrobin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d focusrobin.com -d www.focusrobin.com
```

### Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Daily Operations

### Check Status
```bash
pm2 status
sudo systemctl status nginx
docker ps
```

### View Logs
```bash
pm2 logs focusrobin
sudo tail -f /var/log/nginx/error.log
```

### Update Application
```bash
cd ~/apps/focusrobin
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart focusrobin
```

## Troubleshooting

### App won't start
```bash
pm2 logs focusrobin --err
pm2 restart focusrobin
```

### Database connection error
```bash
docker ps | grep postgres
docker logs focusrobin_postgres
cd ~/focusrobin-db && docker-compose restart
```

### Nginx 502 error
```bash
pm2 status
curl http://localhost:3000
sudo nginx -t
```

## File Locations

- **App:** `~/apps/focusrobin`
- **Database:** `~/focusrobin-db`
- **Nginx Config:** `/etc/nginx/sites-available/focusrobin`
- **PM2 Config:** `~/apps/focusrobin/ecosystem.config.js`
- **Environment:** `~/apps/focusrobin/.env.production`

## Important Notes

1. **Always backup database before updates:**
   ```bash
   docker exec focusrobin_postgres pg_dump -U focusrobin focusrobin_prod > backup.sql
   ```

2. **Check disk space regularly:**
   ```bash
   df -h
   ```

3. **Monitor memory usage:**
   ```bash
   free -h
   pm2 monit
   ```

For detailed instructions, see `VPS_DEPLOYMENT_GUIDE.md`










