# 📤 Upload Files to VPS

## Option 1: Upload via SCP (from your local machine)

**Fix the command - you need `scp` at the beginning:**

```powershell
# From PowerShell on your local machine
scp G:\Dev\focusrobinsite\docker-compose.vps.yml root@72.62.116.105:/var/www/focusrobin/docker-compose.yml
```

**Or use the full path:**
```powershell
scp "G:\Dev\focusrobinsite\docker-compose.vps.yml" root@72.62.116.105:/var/www/focusrobin/docker-compose.yml
```

---

## Option 2: Create Files Directly on VPS (Easier)

Since you're already connected to VPS, just create the files there:

### Create docker-compose.yml on VPS:

```bash
cd /var/www/focusrobin
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

## Next: Create .env File

After creating docker-compose.yml, create the .env file with your environment variables.


---

## Fix for Image Upload Issues (VPS Only)

If you encounter errors uploading images >1MB (HTML error response), you need to update the Nginx configuration on the VPS to allow larger file uploads.

### Option 1: Use the Setup Script (Recommended)

1. Copy the configuration file to VPS:
```powershell
scp g:\Dev\focusrobinsite\deployment\nginx\default.conf root@72.62.116.105:/etc/nginx/sites-available/default
```

2. Restart Nginx on VPS:
```bash
# Run on VPS
sudo systemctl restart nginx
```

### Option 2: Edit Manually on VPS

1. Edit the config:
```bash
nano /etc/nginx/sites-available/default
```

2. Add this line inside the `server { ... }` block:
```nginx
client_max_body_size 20M;
```

3. Save and restart:
```bash
sudo systemctl restart nginx
```

## Option 3: Deploying Updates with Data Persistence

To update the application on the VPS while keeping your database intact (data is safe in volumes), follow these steps:

1. **SSH into VPS**:
   ```bash
   ssh root@72.62.116.105
   # Password if needed
   ```

2. **Navigate to app directory**:
   ```bash
   cd /var/www/focusrobin
   ```

3. **Pull the new image**:
   ```bash
   docker compose pull app
   ```

4. **Restart the application**:
   ```bash
   # This recreates the app container with the new image but keeps volumes
   docker compose up -d app
   ```

5. **Run Database Migrations**:
   Run the migration command inside the running container to update the DB schema without losing data.
   ```bash
   docker compose exec app npm run db:migrate
   ```

That's it! Your site is updated and your data is safe.




