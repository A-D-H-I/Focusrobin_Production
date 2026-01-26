# 🖥️ Hostinger VPS Recommendation for FocusRobin.lt

**Application:** Next.js E-commerce Platform  
**Domain:** focusrobin.lt  
**Date:** January 26, 2026

---

## 📊 Application Requirements Analysis

Your application uses:
- ✅ Next.js 15.3.3 (Node.js runtime)
- ✅ PostgreSQL database (Prisma)
- ✅ Image processing (Sharp, PDF generation)
- ✅ File uploads (S3, but local processing needed)
- ✅ Payment processing (Stripe, PayPal webhooks)
- ✅ Email sending (Resend)
- ✅ MediaPipe face detection (Virtual Try-On)
- ✅ Real-time features (chat, cart)
- ⚠️ GLB files stored but NOT rendered (no 3D rendering)

**Estimated Resource Usage:**
- **RAM:** 1.5-2GB (Node.js + PostgreSQL + image processing)
- **CPU:** 2+ cores (for concurrent requests and image processing)
- **Storage:** 20-40GB SSD (OS + application + logs + temp files)
- **Bandwidth:** 100GB+ (for file uploads, images, PDFs)

---

## 🎯 Recommended Hostinger VPS Plans

### ✅ **BEST CHOICE: VPS 2 Plan**

**Specifications:**
- **CPU:** 2 vCPU cores
- **RAM:** 4 GB
- **Storage:** 80 GB SSD
- **Bandwidth:** 4 TB
- **Price:** ~$8.99/month (with discounts)

**Why This Plan:**
- ✅ **4GB RAM** - Comfortable for Node.js + PostgreSQL + image processing
- ✅ **2 CPU cores** - Handles concurrent requests and image processing
- ✅ **80GB SSD** - Plenty of space for application, logs, and temp files
- ✅ **4TB bandwidth** - More than enough for file uploads and traffic
- ✅ **Good price/performance ratio**

**Suitable for PRODUCTION:**
- ✅ Live production deployment
- ✅ Medium to high traffic (10,000-50,000 visitors/month)
- ✅ 100-200 concurrent users
- ✅ Heavy image processing and PDF generation
- ✅ Multiple admin users managing products
- ✅ Real-time order processing
- ✅ Virtual Try-On (MediaPipe face detection)

---

### 💰 **BUDGET OPTION: VPS 1 Plan** (Minimum)

**Specifications:**
- **CPU:** 1 vCPU core
- **RAM:** 2 GB
- **Storage:** 40 GB SSD
- **Bandwidth:** 2 TB
- **Price:** ~$4.99/month (with discounts)

**Why This Plan:**
- ✅ **2GB RAM** - Minimum for your application (tight but workable)
- ✅ **1 CPU core** - May struggle with concurrent image processing
- ✅ **40GB SSD** - Adequate for test deployment
- ✅ **2TB bandwidth** - Sufficient for testing

**Limitations:**
- ⚠️ May need to optimize image processing (queue system)
- ⚠️ Limited concurrent users (20-30 max)
- ⚠️ May need to use external database (Hostinger PostgreSQL)

**Suitable for:**
- ✅ Test deployment only
- ✅ Low traffic (< 1,000 visitors/month)
- ✅ Development/staging environment

---

### 🚀 **PRODUCTION OPTION: VPS 3 Plan** (Recommended for Live)

**Specifications:**
- **CPU:** 4 vCPU cores
- **RAM:** 8 GB
- **Storage:** 160 GB SSD
- **Bandwidth:** 8 TB
- **Price:** ~$16.99/month (with discounts)

**Why This Plan:**
- ✅ **8GB RAM** - Excellent headroom for growth
- ✅ **4 CPU cores** - Handles heavy image processing easily
- ✅ **160GB SSD** - Plenty of space for logs, backups, temp files
- ✅ **8TB bandwidth** - Handles high traffic

**Suitable for:**
- ✅ Production deployment
- ✅ Medium to high traffic (10,000+ visitors/month)
- ✅ 200+ concurrent users
- ✅ Heavy image processing workloads

---

## 📋 Comparison Table

| Plan | CPU | RAM | Storage | Bandwidth | Price/Month | Best For |
|------|-----|-----|---------|-----------|-------------|----------|
| **VPS 1** | 1 core | 2 GB | 40 GB | 2 TB | ~$4.99 | Test/Dev only |
| **VPS 2** ⭐ | 2 cores | 4 GB | 80 GB | 4 TB | ~$8.99 | **Test/Staging** |
| **VPS 3** | 4 cores | 8 GB | 160 GB | 8 TB | ~$16.99 | Production |
| **VPS 4** | 6 cores | 16 GB | 320 GB | 16 TB | ~$29.99 | High traffic |

---

## 🎯 **My Recommendation for focusrobin.lt (PRODUCTION)**

### For Production Deployment: **VPS 3 Plan** ⭐ RECOMMENDED

**Reasons for PRODUCTION:**
1. **8GB RAM** - Production needs more headroom:
   - ~2-3GB for Node.js application (with caching, sessions)
   - ~1GB for PostgreSQL (if self-hosted, or use managed DB)
   - ~1GB for image processing (Sharp, PDF generation - concurrent)
   - ~1GB for PM2 cluster mode (multiple instances)
   - ~1GB buffer for traffic spikes and OS
   - **Total: ~6-7GB used, 8GB provides safety margin**

2. **4 CPU Cores** - Essential for production:
   - Handle 100+ concurrent requests
   - Parallel image processing (multiple users uploading)
   - PDF generation (can be CPU-intensive)
   - Database queries (concurrent)
   - Background jobs (email sending, invoice generation)

3. **160GB SSD** - Production storage needs:
   - Next.js application (~3-5GB with builds)
   - Node modules (~1-2GB)
   - PostgreSQL data (~20-50GB as you grow)
   - Logs and temp files (~10-20GB)
   - Backups (~10-20GB)
   - System files (~15GB)
   - **Total: ~60-100GB, 160GB allows growth**

4. **8TB Bandwidth** - Production traffic:
   - High image serving (product images, galleries)
   - File uploads (admin, reviews, prescriptions)
   - PDF downloads (invoices, prescriptions)
   - Regular web traffic
   - **8TB handles 50,000+ visitors/month easily**

---

## ⚙️ Optimization Tips for VPS 2

### 1. **Use External Database** (Recommended)
Instead of running PostgreSQL on VPS:
- Use **Hostinger PostgreSQL** (separate service)
- Or use **Supabase/Neon** (free tier available)
- Saves ~500MB RAM

### 2. **Optimize Image Processing**
- Use **queue system** for image processing (Bull/BullMQ)
- Process images asynchronously
- Use S3 for storage (already configured)

### 3. **Enable Next.js Standalone Build**
```env
NEXT_STANDALONE=true
```
This reduces Node.js memory usage.

### 4. **Use PM2 Cluster Mode** (if needed)
```javascript
instances: 2,  // Use 2 instances
exec_mode: 'cluster'
```
Only if you have enough RAM (4GB+).

### 5. **Enable Swap** (Emergency)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```
Adds 2GB swap space (slower but prevents crashes).

---

## 🚀 Setup Checklist

After purchasing VPS 2:

- [ ] Install Node.js 20+ (LTS)
- [ ] Install PostgreSQL (or use external)
- [ ] Install PM2 globally
- [ ] Configure firewall (ports 22, 80, 443)
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Configure Nginx reverse proxy
- [ ] Set up PM2 ecosystem config
- [ ] Configure environment variables
- [ ] Set up database migrations
- [ ] Configure automatic backups
- [ ] Set up monitoring (PM2 monitoring or external)

---

## 💡 Alternative: Use Hostinger PostgreSQL

**Option:** Use Hostinger's managed PostgreSQL instead of self-hosting

**Benefits:**
- ✅ Saves ~500MB RAM on VPS
- ✅ Automatic backups
- ✅ Better performance
- ✅ Can use VPS 1 plan (saves money)

**Then VPS 1 becomes viable:**
- 2GB RAM for Node.js only
- 1 CPU core (still tight but workable)
- ~$4.99/month + PostgreSQL service

---

## 📊 Resource Usage Estimates (PRODUCTION)

### VPS 3 (8GB RAM) - Production Usage:

```
Node.js Application:     ~2.5 GB (with caching, sessions)
PostgreSQL (if local):   ~1.0 GB (production database)
Image Processing:        ~1.0 GB (concurrent processing)
PM2 Cluster (2-3 instances): ~500 MB
System/OS:               ~800 MB
Buffer for spikes:       ~1.7 GB
------------------------
Total Used:              ~7.5 GB (comfortable)
```

### VPS 2 (4GB RAM) - Production Usage (TIGHT):

```
Node.js Application:     ~1.5 GB
PostgreSQL (external):   ~0 MB (must use external)
Image Processing:        ~500 MB (limited concurrency)
System/OS:               ~600 MB
Buffer:                  ~1.4 GB
------------------------
Total Used:              ~4.0 GB (TIGHT - no room for spikes!)
```

### VPS 4 (16GB RAM) - High Traffic Production:

```
Node.js Application:     ~4.0 GB (multiple instances)
PostgreSQL (if local):   ~2.0 GB (large database)
Image Processing:        ~2.0 GB (heavy concurrent)
PM2 Cluster (4 instances): ~1.0 GB
System/OS:               ~1.0 GB
Buffer for spikes:       ~6.0 GB
------------------------
Total Used:              ~16.0 GB (excellent headroom)
```

---

## 🎯 Final Recommendation for PRODUCTION

### **For Production Deployment (focusrobin.lt):**

**✅ VPS 3 Plan** - $16.99/month ⭐ **RECOMMENDED**
- **8GB RAM** - Handles production traffic spikes
- **4 CPU cores** - Parallel processing for multiple users
- **160GB SSD** - Room for growth and backups
- **8TB bandwidth** - Handles high traffic
- **Best price/performance for production**

**Why not VPS 2 for production?**
- ⚠️ 4GB RAM is tight for production (traffic spikes can cause issues)
- ⚠️ 2 CPU cores may bottleneck during peak hours
- ⚠️ 80GB storage fills up quickly with logs and backups
- ⚠️ May need to upgrade soon, costing more in long run

### **If Budget Allows:**

**✅ VPS 4 Plan** - $29.99/month (For High Traffic)
- **16GB RAM** - Excellent for scaling
- **6 CPU cores** - Handles heavy loads easily
- **320GB SSD** - Plenty of space
- **16TB bandwidth** - Enterprise-level traffic
- **Best for:** 50,000+ visitors/month, multiple admins, heavy processing

### **Minimum Production (Not Recommended):**

**⚠️ VPS 2 Plan** - $8.99/month (Only if budget is very tight)
- Requires external PostgreSQL (mandatory)
- Must optimize everything (image queue, caching)
- Monitor closely - may need upgrade quickly
- Risk of downtime during traffic spikes

---

## 🔗 Hostinger VPS Links

- **VPS Plans:** https://www.hostinger.com/vps-hosting
- **PostgreSQL Hosting:** Check Hostinger's database services
- **Documentation:** https://support.hostinger.com/en/category/vps

---

## 📝 Production Deployment Steps

1. **Purchase VPS 3** from Hostinger (recommended for production)
2. **Set up server** (Ubuntu 22.04 LTS recommended)
3. **Install dependencies** (Node.js 20+, PM2, Nginx, PostgreSQL)
4. **Configure production environment**:
   - SSL certificate (Let's Encrypt)
   - Firewall (UFW)
   - Database (PostgreSQL or managed service)
   - Monitoring (PM2 monitoring or external)
5. **Deploy application** using production deployment guide
6. **Set up backups** (automated daily backups)
7. **Configure monitoring** (uptime, performance, errors)
8. **Load testing** before going live
9. **Monitor closely** for first week, adjust as needed

## 🚨 Production Checklist

Before going live:
- [ ] VPS 3 (or higher) purchased
- [ ] SSL certificate configured
- [ ] All environment variables set (production keys)
- [ ] Database configured and migrated
- [ ] PM2 configured with auto-restart
- [ ] Nginx reverse proxy configured
- [ ] Firewall rules set
- [ ] Backups automated
- [ ] Monitoring set up
- [ ] Load testing completed
- [ ] Error logging configured
- [ ] CDN configured (optional but recommended)

---

*Last updated: January 26, 2026*  
*Application: FocusRobin E-commerce Platform*

