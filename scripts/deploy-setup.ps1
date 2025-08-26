# EvoFit DigitalOcean Deployment Setup Script (PowerShell)
# This script helps set up the initial DigitalOcean infrastructure

Write-Host "🚀 EvoFit DigitalOcean Deployment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if doctl is installed
try {
    $null = Get-Command doctl -ErrorAction Stop
} catch {
    Write-Host "❌ doctl CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.digitalocean.com/reference/doctl/how-to/install/" -ForegroundColor Yellow
    exit 1
}

# Check if authenticated
try {
    $null = doctl auth list 2>$null
} catch {
    Write-Host "❌ Not authenticated with DigitalOcean. Please run:" -ForegroundColor Red
    Write-Host "   doctl auth init" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Prerequisites checked" -ForegroundColor Green
Write-Host ""

# Configuration
$REGISTRY_NAME = "bci"
$REGION = "tor1"
$DB_NAME = "evofit-db"
$DB_SIZE = "db-s-1vcpu-1gb"
$APP_NAME = "evofit-prod"

Write-Host "📋 Configuration:" -ForegroundColor Blue
Write-Host "  Registry: $REGISTRY_NAME"
Write-Host "  Region: $REGION"
Write-Host "  Database: $DB_NAME"
Write-Host "  App: $APP_NAME"
Write-Host ""

# Create Container Registry
Write-Host "1️⃣ Creating Container Registry..." -ForegroundColor Yellow
$registryExists = doctl registry get 2>$null | Select-String $REGISTRY_NAME
if ($registryExists) {
    Write-Host "   ✅ Registry already exists" -ForegroundColor Green
} else {
    doctl registry create $REGISTRY_NAME --region $REGION
    Write-Host "   ✅ Registry created" -ForegroundColor Green
}

# Login to registry
Write-Host ""
Write-Host "2️⃣ Logging into Container Registry..." -ForegroundColor Yellow
doctl registry login
Write-Host "   ✅ Logged in" -ForegroundColor Green

# Create Database
Write-Host ""
Write-Host "3️⃣ Creating Database Cluster..." -ForegroundColor Yellow
$dbExists = doctl databases list | Select-String $DB_NAME
if ($dbExists) {
    Write-Host "   ✅ Database already exists" -ForegroundColor Green
} else {
    doctl databases create $DB_NAME `
        --engine pg `
        --version 14 `
        --size $DB_SIZE `
        --region $REGION `
        --num-nodes 1
    Write-Host "   ✅ Database cluster created" -ForegroundColor Green
    Write-Host "   ⏳ Database will take 5-10 minutes to provision" -ForegroundColor Yellow
}

# Create App
Write-Host ""
Write-Host "4️⃣ Creating App Platform application..." -ForegroundColor Yellow
if (Test-Path "app.yaml") {
    $appExists = doctl apps list | Select-String $APP_NAME
    if ($appExists) {
        Write-Host "   ✅ App already exists" -ForegroundColor Green
        $APP_ID = (doctl apps list --format ID,Name --no-header | Select-String $APP_NAME).ToString().Split()[0]
        Write-Host "   App ID: $APP_ID" -ForegroundColor Cyan
    } else {
        $APP_OUTPUT = doctl apps create --spec app.yaml
        $APP_ID = ($APP_OUTPUT | Select-String "ID:").ToString().Split()[1]
        Write-Host "   ✅ App created" -ForegroundColor Green
        Write-Host "   App ID: $APP_ID" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ❌ app.yaml not found in current directory" -ForegroundColor Red
    exit 1
}

# Instructions
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Magenta
Write-Host "==============" -ForegroundColor Magenta
Write-Host ""
Write-Host "1. Wait for database to finish provisioning (5-10 minutes)" -ForegroundColor White
Write-Host "   Check status: doctl databases get $DB_NAME" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Set up environment secrets:" -ForegroundColor White
Write-Host "   doctl apps config set $APP_ID JWT_SECRET=<your-secret>" -ForegroundColor Gray
Write-Host "   doctl apps config set $APP_ID OPENAI_API_KEY=<your-key>" -ForegroundColor Gray
Write-Host "   doctl apps config set $APP_ID AWS_ACCESS_KEY_ID=<your-key>" -ForegroundColor Gray
Write-Host "   doctl apps config set $APP_ID AWS_SECRET_ACCESS_KEY=<your-secret>" -ForegroundColor Gray
Write-Host "   doctl apps config set $APP_ID S3_BUCKET_NAME=<your-bucket>" -ForegroundColor Gray
Write-Host "   doctl apps config set $APP_ID GOOGLE_CLIENT_ID=<your-id>" -ForegroundColor Gray
Write-Host "   doctl apps config set $APP_ID GOOGLE_CLIENT_SECRET=<your-secret>" -ForegroundColor Gray
Write-Host "   doctl apps config set $APP_ID STRIPE_PUBLIC_KEY=<your-key>" -ForegroundColor Gray
Write-Host "   doctl apps config set $APP_ID STRIPE_SECRET_KEY=<your-secret>" -ForegroundColor Gray
Write-Host "   doctl apps config set $APP_ID STRIPE_WEBHOOK_SECRET=<your-secret>" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Build and push Docker image:" -ForegroundColor White
Write-Host "   docker build --target prod -t evofit:prod ." -ForegroundColor Gray
Write-Host "   docker tag evofit:prod registry.digitalocean.com/$REGISTRY_NAME/evofit:prod" -ForegroundColor Gray
Write-Host "   docker push registry.digitalocean.com/$REGISTRY_NAME/evofit:prod" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Monitor deployment:" -ForegroundColor White
Write-Host "   doctl apps get $APP_ID" -ForegroundColor Gray
Write-Host "   doctl apps logs $APP_ID" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Update DO_DEPLOYMENT_GUIDE.md with your App ID: $APP_ID" -ForegroundColor White
Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Green
