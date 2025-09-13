# Multi-stage build for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Build the application
FROM base AS builder
WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy source code (excluding .env files)
COPY . .
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Build frontend (without NODE_ENV in .env file)
RUN NODE_ENV=production npm run build

# Build backend
RUN npm run server:build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 taskoro

# Copy built application
COPY --from=deps --chown=taskoro:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=taskoro:nodejs /app/dist ./dist
COPY --from=builder --chown=taskoro:nodejs /app/prisma ./prisma
COPY --from=builder --chown=taskoro:nodejs /app/package*.json ./

# Copy environment files
COPY --chown=taskoro:nodejs .env.production .env

# Switch to non-root user
USER taskoro

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "run", "server:start"]