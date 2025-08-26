#!/bin/bash

# EvoFit DigitalOcean Deployment Setup Script
# This script helps set up the initial DigitalOcean infrastructure

echo "🚀 EvoFit DigitalOcean Deployment Setup"
echo "========================================"

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl CLI not found. Please install it first:"
    echo "   https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Check if authenticated
if ! doctl auth list &> /dev/null; then
    echo "❌ Not authenticated with DigitalOcean. Please run:"
    echo "   doctl auth init"
    exit 1
fi

echo "✅ Prerequisites checked"
echo ""

# Configuration
REGISTRY_NAME="bci"
REGION="tor1"
DB_NAME="evofit-db"
DB_SIZE="db-s-1vcpu-1gb"
APP_NAME="evofit-prod"

echo "📋 Configuration:"
echo "  Registry: $REGISTRY_NAME"
echo "  Region: $REGION"
echo "  Database: $DB_NAME"
echo "  App: $APP_NAME"
echo ""

# Create Container Registry
echo "1️⃣ Creating Container Registry..."
if doctl registry get 2>/dev/null | grep -q "$REGISTRY_NAME"; then
    echo "   ✅ Registry already exists"
else
    doctl registry create $REGISTRY_NAME --region $REGION
    echo "   ✅ Registry created"
fi

# Login to registry
echo ""
echo "2️⃣ Logging into Container Registry..."
doctl registry login
echo "   ✅ Logged in"

# Create Database
echo ""
echo "3️⃣ Creating Database Cluster..."
if doctl databases list | grep -q "$DB_NAME"; then
    echo "   ✅ Database already exists"
else
    doctl databases create $DB_NAME \
        --engine pg \
        --version 14 \
        --size $DB_SIZE \
        --region $REGION \
        --num-nodes 1
    echo "   ✅ Database cluster created"
    echo "   ⏳ Database will take 5-10 minutes to provision"
fi

# Create App
echo ""
echo "4️⃣ Creating App Platform application..."
if [ -f "app.yaml" ]; then
    if doctl apps list | grep -q "$APP_NAME"; then
        echo "   ✅ App already exists"
        APP_ID=$(doctl apps list --format ID,Name --no-header | grep "$APP_NAME" | awk '{print $1}')
        echo "   App ID: $APP_ID"
    else
        APP_OUTPUT=$(doctl apps create --spec app.yaml)
        APP_ID=$(echo "$APP_OUTPUT" | grep -oP '(?<=ID:)\s*\S+' | tr -d ' ')
        echo "   ✅ App created"
        echo "   App ID: $APP_ID"
    fi
else
    echo "   ❌ app.yaml not found in current directory"
    exit 1
fi

# Instructions
echo ""
echo "🎯 Next Steps:"
echo "=============="
echo ""
echo "1. Wait for database to finish provisioning (5-10 minutes)"
echo "   Check status: doctl databases get $DB_NAME"
echo ""
echo "2. Set up environment secrets:"
echo "   doctl apps config set $APP_ID JWT_SECRET=<your-secret>"
echo "   doctl apps config set $APP_ID OPENAI_API_KEY=<your-key>"
echo "   doctl apps config set $APP_ID AWS_ACCESS_KEY_ID=<your-key>"
echo "   doctl apps config set $APP_ID AWS_SECRET_ACCESS_KEY=<your-secret>"
echo "   doctl apps config set $APP_ID S3_BUCKET_NAME=<your-bucket>"
echo "   doctl apps config set $APP_ID GOOGLE_CLIENT_ID=<your-id>"
echo "   doctl apps config set $APP_ID GOOGLE_CLIENT_SECRET=<your-secret>"
echo "   doctl apps config set $APP_ID STRIPE_PUBLIC_KEY=<your-key>"
echo "   doctl apps config set $APP_ID STRIPE_SECRET_KEY=<your-secret>"
echo "   doctl apps config set $APP_ID STRIPE_WEBHOOK_SECRET=<your-secret>"
echo ""
echo "3. Build and push Docker image:"
echo "   docker build --target prod -t evofit:prod ."
echo "   docker tag evofit:prod registry.digitalocean.com/$REGISTRY_NAME/evofit:prod"
echo "   docker push registry.digitalocean.com/$REGISTRY_NAME/evofit:prod"
echo ""
echo "4. Monitor deployment:"
echo "   doctl apps get $APP_ID"
echo "   doctl apps logs $APP_ID"
echo ""
echo "5. Update DO_DEPLOYMENT_GUIDE.md with your App ID: $APP_ID"
echo ""
echo "✨ Setup complete!"
