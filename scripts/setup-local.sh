#!/usr/bin/env bash

echo "Setting up local development environment..."

# Start Docker services
echo "Starting Docker services..."
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate dev

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Local development environment is ready!"
echo "Run 'npm run dev' to start the development server."
