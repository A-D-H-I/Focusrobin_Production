# 🔐 Environment Variables (.env) File Guide

## Database Connection Details

The database credentials are **already configured in docker-compose.yml**. You just need to match them in your `.env` file.

### Database Credentials (from docker-compose.yml):

- **Username:** `postgres`
- **Password:** `SUKa9599@5567`
- **Database Name:** `focusrobin`
- **Host:** `postgres` (this is the service name in docker-compose)
- **Port:** `5432`

### DATABASE_URL Format:

When the app runs **inside Docker** (connected to the postgres container):
```
DATABASE_URL=postgresql://postgres:SUKa9599@5567@postgres:5432/focusrobin?schema=public
```

**Breakdown:**
- `postgresql://` - Protocol
- `postgres` - Username
- `SUKa9599@5567` - Password
- `@postgres` - Hostname (service name in docker-compose)
- `:5432` - Port
- `/focusrobin` - Database name
- `?schema=public` - Schema

---

## Complete .env File Template

Create this file on your VPS at `/var/www/focusrobin/.env`:

```env
# Node Environment
NODE_ENV=production
PORT=3000

# Database Connection (for Docker containers)
# Hostname is "postgres" because that's the service name in docker-compose
DATABASE_URL=postgresql://postgres:SUKa9599@5567@postgres:5432/focusrobin?schema=public

# NextAuth
NEXTAUTH_SECRET=your_secret_key_here_min_32_characters_long
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
```

---

## Important Notes

1. **Database credentials match docker-compose.yml:**
   - Username: `postgres`
   - Password: `SUKa9599@5567`
   - Database: `focusrobin`

2. **Hostname is "postgres":**
   - This is the **service name** in docker-compose.yml
   - Docker automatically resolves this to the postgres container
   - Do NOT use `localhost` or `127.0.0.1` when running in Docker

3. **If you want to change the password:**
   - Update it in **both** places:
     - `docker-compose.yml` (POSTGRES_PASSWORD)
     - `.env` file (DATABASE_URL)

---

## Quick Reference

**Database Username:** `postgres`  
**Database Password:** `SUKa9599@5567`  
**Database Name:** `focusrobin`  
**Host (in Docker):** `postgres`  
**Port:** `5432`

**Full Connection String:**
```
postgresql://postgres:SUKa9599@5567@postgres:5432/focusrobin?schema=public
```

---

**Last Updated:** January 27, 2026









