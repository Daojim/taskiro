#!/bin/bash

# Taskiro Deployment Script
set -e

echo "🚀 Starting Taskiro deployment..."

# Validate environment variables
echo "🔍 Validating environment..."
node scripts/validate-env.js

# Create logs directory
mkdir -p logs

# Build the application
echo "📦 Building application..."
npm run build:prod

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t taskiro:latest .

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Start new containers
echo "🚀 Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T app npm run db:migrate:prod

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Deployment successful! Application is running at http://localhost"
else
    echo "❌ Health check failed. Check logs:"
    docker-compose -f docker-compose.prod.yml logs app
    exit 1
fi

echo "🎉 Deployment completed successfully!"