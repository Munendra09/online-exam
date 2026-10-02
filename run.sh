#!/bin/bash
echo "🚀 Starting LTA Exam Portal DevOps Project..."
echo "🐳 Building and starting Docker containers..."
docker compose --env-file .env.local up -d --build

echo "✅ Project started successfully!"
echo "🌐 Frontend is running at: http://localhost:3000"
echo "⚙️  Backend is running at: http://localhost:5000"
echo "🗄️  Database is running on port: 3306"
