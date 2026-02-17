# PowerShell script to set up DATABASE_URL and sync database
Write-Host "🔧 Setting up database connection..." -ForegroundColor Green

# Load environment variables from .env file
$envPath = ".env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
    Write-Host "✅ Environment variables loaded from .env" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

# Show current DATABASE_URL (masked)
$dbUrl = [System.Environment]::GetEnvironmentVariable("DATABASE_URL")
if ($dbUrl) {
    $maskedUrl = $dbUrl.Substring(0, [Math]::Min(20, $dbUrl.Length)) + "..."
    Write-Host "📊 DATABASE_URL: $maskedUrl" -ForegroundColor Yellow
} else {
    Write-Host "❌ DATABASE_URL not set!" -ForegroundColor Red
}

# Generate Prisma client
Write-Host "📦 Generating Prisma client..." -ForegroundColor Cyan
try {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Prisma client generated" -ForegroundColor Green
    } else {
        Write-Host "❌ Prisma generation failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Prisma generation error: $_" -ForegroundColor Red
    exit 1
}

# Push schema to database
Write-Host "🗄️ Pushing schema to database..." -ForegroundColor Cyan
try {
    npx prisma db push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database synchronized successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Database sync failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Database sync error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Setup complete!" -ForegroundColor Green
