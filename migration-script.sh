#!/bin/bash
# migration-script.sh

# 1. Connect to the 'app-network' (default is usually directory_default, let's check docker compose network name)
# We will use the container name directly assuming default network.

echo "Starting Temporary Migration Container..."

# Run a temporary node container, mount the schema, and run migration
docker run --rm \
  --network focusrobin_default \
  -v $(pwd)/prisma:/app/prisma \
  -v $(pwd)/.env:/app/.env \
  -w /app \
  node:20-alpine \
  /bin/sh -c "npm install -g prisma && npx prisma migrate deploy"

echo "Migration script finished."
