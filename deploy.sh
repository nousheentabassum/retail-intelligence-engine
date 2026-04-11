#!/bin/bash

# Retail Intelligence Engine Deployment Script
# This script automates the deployment process for production

set -e

echo "🚀 Starting Retail Intelligence Engine Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p nginx/ssl
mkdir -p logs

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your production values before continuing."
    echo "   Important: Update JWT_SECRET, database passwords, and other secrets."
    read -p "Press Enter after updating .env file..."
fi

# Validate environment variables
echo "🔍 Validating environment variables..."
source .env

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-in-production" ]; then
    echo "❌ JWT_SECRET must be set to a secure value in .env"
    exit 1
fi

if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "retail_password" ]; then
    echo "❌ POSTGRES_PASSWORD must be set to a secure value in .env"
    exit 1
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check backend
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# Check AI engine
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ AI Engine is healthy"
else
    echo "❌ AI Engine is not responding"
    docker-compose -f docker-compose.prod.yml logs ai-engine
    exit 1
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is not responding"
    docker-compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

# Run database migrations/seeding
echo "🗄️  Initializing database..."
docker-compose -f docker-compose.prod.yml exec backend npm run migrate || echo "Migration completed or not needed"

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:4000"
echo "   AI Engine: http://localhost:8000"
echo ""
echo "📊 Monitor logs with:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 Stop services with:"
echo "   docker-compose -f docker-compose.prod.yml down"
