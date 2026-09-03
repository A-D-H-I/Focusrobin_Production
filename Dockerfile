# Multi-stage build for Next.js standalone production image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and prisma schema (needed for postinstall)
COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY prisma ./prisma

# Install dependencies (skip postinstall to avoid prisma generate during deps)
RUN \
  if [ -f package-lock.json ]; then \
    npm ci --ignore-scripts; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm i --no-frozen-lockfile --ignore-scripts; \
  else \
    npm install --ignore-scripts; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
ARG CACHEBUST=4
COPY . .

# Set environment variable for standalone build
ENV NEXT_STANDALONE=true
ENV NODE_ENV=production

# auth.ts throws at module load if no secret is set, which Next.js's build
# hits while statically generating pages (e.g. /_not-found) that import it.
# Passed as a build ARG so it's available for this step only - it lives in
# the discarded builder stage and never reaches the runner stage/final image,
# unlike copying .env.production in (which is what caused the secret leak).
ARG AUTH_SECRET
ENV AUTH_SECRET=$AUTH_SECRET

# Generate Prisma client (now that we have all files)
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install OpenSSL (required for Prisma)
RUN apk add --no-cache openssl

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
# Copy Google credentials file if it exists (for translation API)
COPY --from=builder /app/google-credentials.json* ./

# Next.js's standalone output automatically copies .env/.env.production into
# .next/standalone at build time regardless of .dockerignore, which would
# otherwise bake production secrets into this image layer. Runtime env vars
# are supplied via docker-compose's env_file at container start instead, so
# strip any that made it in here as a hard safety net.
RUN rm -f ./.env ./.env.local ./.env.development ./.env.development.local \
  ./.env.production ./.env.production.local ./.env.test ./.env.test.local

# Install Prisma CLI globally to run migrations (pin version to match package.json)
RUN npm install -g prisma@5.22.0

# Set correct permissions
RUN chown -R nextjs:nodejs /app
# Allow nextjs user to write to global node_modules (required for Prisma engine download/execution)
RUN chown -R nextjs:nodejs /usr/local/lib/node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy startup script with execution permissions
COPY --chmod=755 start.sh ./

# Start the application using startup script
CMD ["./start.sh"]

