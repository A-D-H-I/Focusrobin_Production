# VPS Deployment Rescue - Final Steps

You have successfully:
1. Updated the Docker image.
2. Fixed the `latest` vs `general` tag issue.
3. Unlocked the "stuck" database migration.

**You are one step away from the site being live.**

## 1. Login to VPS
(You are already logged in, but if you reconnect:)
```bash
ssh root@72.62.116.105
```

## 2. Go to Directory
```bash
cd /var/www/focusrobin
```

## 3. Restart the App
This command recreates the container with the new configuration and unblocked database.
```bash
docker compose up -d
```

## 4. Verify Startup (Watch Logs)
Run this to watch the app start. You should see "Running database migrations..." follow by "Starting application..." or "Ready in ...ms".
```bash
docker logs -f focusrobin_app
```
*(Press `Ctrl+C` to exit the log view once you see the app has started)*

## Troubleshooting
If you still see a "P3009" error (migration failed), run this command again to unlock it, then restart:
```bash
docker compose run --rm app prisma migrate resolve --applied 20250111000000_make_prescription_per_user
```
