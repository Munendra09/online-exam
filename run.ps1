Write-Host "🚀 Starting LTA Exam Portal DevOps Project..." -ForegroundColor Green
Write-Host "🐳 Building and starting Docker containers..." -ForegroundColor Cyan

docker-compose --env-file .env.local up -d --build

Write-Host "✅ Project started successfully!" -ForegroundColor Green
Write-Host "🌐 Frontend is running at: http://localhost:3000" -ForegroundColor Yellow
Write-Host "⚙️  Backend is running at: http://localhost:5000" -ForegroundColor Yellow
Write-Host "🗄️  Database is running on port: 3306" -ForegroundColor Yellow
