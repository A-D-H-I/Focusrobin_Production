#!/bin/bash

# Fresh VPS Installation Script
# Run this after completely wiping your VPS

echo "🚀 Starting fresh VPS installation..."

# 1. Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# 2. Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# 3. Install Docker Compose
echo "📋 Installing Docker Compose..."
apt install -y docker-compose-plugin

# 4. Start and enable Docker
echo "▶️  Starting Docker service..."
systemctl start docker
systemctl enable docker

# 5. Verify Docker installation
echo "✅ Verifying Docker installation..."
docker --version
docker compose version

# 6. Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p /var/www/focusrobin
cd /var/www/focusrobin

# 7. Create docker-compose.yml
echo "📝 Creating docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: focusrobin_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-SUKa9599@5567}
      POSTGRES_DB: focusrobin
    ports:
      - "127.0.0.1:5432:5432"  # Only accessible from localhost for security
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - focusrobin-network

  # Next.js Application (pulled from Docker Hub)
  app:
    image: hariharan11111/focusrobin-app:latest
    container_name: focusrobin_app
    restart: always
    ports:
      - "3000:3000"  # Expose app directly
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD:-SUKa9599@5567}@postgres:5432/focusrobin?schema=public
      - GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - focusrobin-network
    # Load env file if available
    env_file:
      - .env

networks:
  focusrobin-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
EOF

echo "✅ docker-compose.yml created!"

# 8. Create .env file template
echo "📝 Creating .env file template..."
cat > .env << 'EOF'
# Database
POSTGRES_PASSWORD=SUKa9599@5567
DATABASE_URL=postgresql://postgres:SUKa9599@5567@postgres:5432/focusrobin?schema=public

# NextAuth
NEXTAUTH_URL=http://your-domain.com
NEXTAUTH_SECRET=your-secret-key-here

# Add your other environment variables here
EOF

echo "✅ .env template created!"
echo ""
echo "⚠️  IMPORTANT: Edit .env file with your actual values:"
echo "   nano /var/www/focusrobin/.env"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your environment variables"
echo "2. Run: docker compose pull"
echo "3. Run: docker compose up -d"
echo "4. Run migrations: docker compose exec app npx prisma migrate deploy"
echo ""
echo "✅ Installation complete!"







