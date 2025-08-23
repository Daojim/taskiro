#!/bin/bash

# Render build script for Taskiro
set -e

echo "🏗️ Building Taskiro for Render..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:migrate:prod

# Build server
echo "🖥️ Building server..."
npm run server:build

echo "✅ Build completed successfully!"