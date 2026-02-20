# 🚀 VPS Deployment Checklist - FocusRobin.lt

**Date:** January 26, 2026  
**Status:** ✅ Build Ready for Deployment

---

## ✅ Pre-Deployment Checklist (COMPLETED)

- [x] **Deleted old build artifacts**
  - [x] Removed `build.zip`
  - [x] Removed `build_lite.zip`
  - [x] Removed `.next` folder

- [x] **Build Configuration Verified**
  - [x] Standalone output enabled (`NEXT_STANDALONE=true`)
  - [x] Next.js config verified for production
  - [x] Security headers configured

- [x] **Local Build Created**
  - [x] Build completed successfully
  - [x] Standalone build created at `.next/standalone/`
  - [x] Server.js file verified

- [x] **Local Testing Completed**
  - [x] Standalone server started successfully
  - [x] Homepage loads correctly (HTTP 200)
  - [x] No critical errors detected

---

## 📦 Build Information

**Build Location:** `G:\Dev\focusrobinsite\.next\standalone\`

**Key Files:**
- `server.js` - Main server entry point
- `.next/` - Next.js build output
- `node_modules/` - Production dependencies
- `public/` - Static assets
- `package.json` - Package configuration

**Build Command Used:**
```bash
NEXT_STANDALONE=true npm run build
```

**Start Command:**
```bash
node .next/standalone/server.js
```

---

## 🖥️ VPS Deployment Steps

### Step 1: Connect to VPS
```bash
ssh your-username@your-vps-ip
```

### Step 2: Stop Existing Application (if running)
```bash
# If using PM2
pm2 stop focusrobin
pm2 delete focusrobin

# Or if using systemd
sudo systemctl stop focusrobin
sudo systemctl disable focusrobin
```

### Step 3: Backup Existing Application (if needed)
```bash
# Navigate to app directory
cd /home/your-username/apps/focusrobin

# Create backup
sudo mv focusrobin focusrobin_backup_$(date +%Y%m%d)
```

### Step 4: Remove Old Application Files
```bash
# Remove old application (be careful!)
sudo rm -rf /home/your-username/apps/focusrobin
# Or move to backup location
```

### Step 5: Upload New Build to VPS

**Option A: Using SCP (from local Windows machine)**
```powershell
# From your local machine (PowerShell)
scp -r G:\Dev\focusrobinsite\.next\standalone\* your-username@your-vps-ip:/home/your-username/apps/focusrobin/
```

**Option B: Using Git (recommended)**
```bash
# On VPS
cd /home/your-username/apps
git clone your-repo-url focusrobin
cd focusrobin
git pull origin main  # or your branch name
```

**Option C: Using SFTP/FTP Client**
- Upload the entire `.next/standalone` folder contents to `/home/your-username/apps/focusrobin/`

### Step 6: Install Dependencies on VPS
```bash
cd /home/your-username/apps/focusrobin

# Install Node.js dependencies (if not already in standalone)
npm install --production
```

### Step 7: Set Up Environment Variables
```bash
# Create/update .env file
nano .env
```

**Required Environment Variables:**
- `NODE_ENV=production`
- `DATABASE_URL=your_postgresql_connection_string`
- `NEXTAUTH_SECRET=your_secret_key`
- `NEXTAUTH_URL=https://focusrobin.lt`
- `AWS_ACCESS_KEY_ID=your_aws_key`
- `AWS_SECRET_ACCESS_KEY=your_aws_secret`
- `AWS_REGION=eu-central-1`
- `AWS_S3_BUCKET_NAME=focusrobin`
- `STRIPE_SECRET_KEY=your_stripe_key`
- `STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key`
- `RESEND_API_KEY=your_resend_key`
- `GOOGLE_CLIENT_ID=your_google_client_id`
- `GOOGLE_CLIENT_SECRET=your_google_client_secret`
- `FACEBOOK_CLIENT_ID=your_facebook_client_id`
- `FACEBOOK_CLIENT_SECRET=your_facebook_client_secret`
- `PORT=3000`

### Step 8: Run Database Migrations
```bash
cd /home/your-username/apps/focusrobin
npx prisma migrate deploy
```

### Step 9: Set Up PM2 (Process Manager)

**Create ecosystem.config.js:**
```bash
nano ecosystem.config.js
```

**Content:**
```javascript
module.exports = {
  apps: [{
    name: 'focusrobin',
    script: 'node .next/standalone/server.js',
    cwd: '/home/your-username/apps/focusrobin',
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
    min_uptime: '10s',
    max_memory_restart: '2G'
  }]
};
```

**Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start on boot
```

### Step 10: Configure Nginx (Reverse Proxy)

**Edit Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/focusrobin
```

**Configuration:**
```nginx
server {
    listen 80;
    server_name focusrobin.lt www.focusrobin.lt;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name focusrobin.lt www.focusrobin.lt;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/focusrobin.lt/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/focusrobin.lt/privkey.pem;
    
    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable and restart Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/focusrobin /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Step 11: Set Up SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d focusrobin.lt -d www.focusrobin.lt
```

### Step 12: Configure Firewall
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## ✅ Post-Deployment Verification

### 1. Check Application Status
```bash
pm2 status
pm2 logs focusrobin --lines 50
```

### 2. Test Application
- [ ] Visit `https://focusrobin.lt` - Homepage loads
- [ ] Test product pages
- [ ] Test authentication (login/signup)
- [ ] Test checkout process
- [ ] Test admin panel
- [ ] Test API endpoints

### 3. Check Server Resources
```bash
# Check memory usage
free -h

# Check CPU usage
top

# Check disk space
df -h

# Check PM2 memory usage
pm2 monit
```

### 4. Monitor Logs
```bash
# PM2 logs
pm2 logs focusrobin

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Application logs
tail -f /home/your-username/apps/focusrobin/logs/pm2-error.log
tail -f /home/your-username/apps/focusrobin/logs/pm2-out.log
```

### 5. Test Performance
- [ ] Page load times acceptable
- [ ] Images loading correctly
- [ ] Database queries working
- [ ] API responses fast

---

## 🔧 Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs focusrobin --err

# Check if port is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart focusrobin
```

### Database Connection Issues
```bash
# Test database connection
npx prisma db pull

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Nginx 502 Bad Gateway
```bash
# Check if Next.js is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart focusrobin
sudo systemctl restart nginx
```

### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## 📝 Important Notes

1. **Standalone Build**: The build uses Next.js standalone output, which includes only necessary dependencies.

2. **Environment Variables**: Make sure all production environment variables are set correctly.

3. **Database**: Ensure PostgreSQL is running and accessible.

4. **File Permissions**: Make sure the application has proper read/write permissions:
   ```bash
   sudo chown -R your-username:your-username /home/your-username/apps/focusrobin
   ```

5. **Logs Directory**: Create logs directory if it doesn't exist:
   ```bash
   mkdir -p /home/your-username/apps/focusrobin/logs
   ```

6. **Backup**: Always backup before deploying:
   ```bash
   # Backup database
   pg_dump your_database > backup_$(date +%Y%m%d).sql
   
   # Backup application
   tar -czf focusrobin_backup_$(date +%Y%m%d).tar.gz /home/your-username/apps/focusrobin
   ```

---

## 🎯 Quick Deployment Commands

**Full deployment sequence:**
```bash
# 1. Stop old app
pm2 stop focusrobin

# 2. Backup (optional)
cp -r /home/your-username/apps/focusrobin /home/your-username/apps/focusrobin_backup

# 3. Upload new build (from local or git pull)

# 4. Install dependencies
npm install --production

# 5. Run migrations
npx prisma migrate deploy

# 6. Restart app
pm2 restart focusrobin

# 7. Check status
pm2 status
pm2 logs focusrobin
```

---

## ✅ Deployment Status

- [x] Build created and tested locally
- [ ] Application uploaded to VPS
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] PM2 configured and started
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Application tested on production domain
- [ ] Monitoring set up

---

**Last Updated:** January 26, 2026  
**Next Steps:** Provide VPS access for deployment











