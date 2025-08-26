# DigitalOcean Production Deployment Guide - EvoFit

## 🚀 Quick Deployment Commands

```bash
# 1. Login to DigitalOcean Container Registry
doctl registry login

# 2. Build production Docker image
docker build --target prod -t evofit:prod .

# 3. Tag for DigitalOcean registry
docker tag evofit:prod registry.digitalocean.com/bci/evofit:prod

# 4. Push to registry (triggers auto-deploy)
docker push registry.digitalocean.com/bci/evofit:prod
```

## 📋 Production App Details

| Setting | Value |
|---------|-------|
| **App Name** | `evofit-prod` |
| **App ID** | `[TO BE CREATED]` |
| **Production URL** | https://evofit.com (or your chosen domain) |
| **DigitalOcean URL** | https://evofit-prod-xxxxx.ondigitalocean.app |
| **Region** | Toronto (tor) |
| **Registry** | `registry.digitalocean.com/bci/evofit` |
| **Deploy Tag** | `prod` |
| **Auto-deploy** | ✅ Enabled |

## 🔐 Authentication Setup

### DigitalOcean Container Registry
```bash
# Login with doctl (recommended - 30 day validity)
doctl registry login

# Or manual login with credentials (token stored in environment variable)
echo "$DIGITALOCEAN_TOKEN" | docker login registry.digitalocean.com -u bci --password-stdin
```

### Credentials
- **Registry User**: `bci`
- **Registry Token**: `$DIGITALOCEAN_TOKEN` (stored in environment variable)

## 🏗️ Build Configuration

### Dockerfile Target
- **Development**: `--target dev`
- **Production**: `--target prod`

### Key Build Features
- ✅ Multi-stage build (base → builder → prod)
- ✅ Drizzle config verification
- ✅ Automatic database migrations
- ✅ Security: non-root user
- ✅ Next.js optimized production build

## 📊 Monitoring & Management

### Check App Status
```bash
# List all apps
doctl apps list

# Get specific app details
doctl apps get <app-id>

# Check current deployment
doctl apps get-deployment <app-id> <deployment-id>

# View app logs
doctl apps logs <app-id>
```

### Registry Management
```bash
# List repositories
doctl registry repository list

# List images in repository
doctl registry repository list-tags bci/evofit

# Delete old images
doctl registry repository delete-tag bci/evofit <tag>
```

## 🌐 Environment Variables (Production)

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Auto-injected from managed database |
| `JWT_SECRET` | Authentication secret |
| `OPENAI_API_KEY` | AI workout generation |
| `AWS_ACCESS_KEY_ID` | AWS S3 for file storage |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret |
| `AWS_REGION` | AWS region (e.g., `us-east-1`) |
| `S3_BUCKET_NAME` | S3 bucket for user uploads |
| `GOOGLE_CLIENT_ID` | OAuth authentication |
| `GOOGLE_CLIENT_SECRET` | OAuth secret |
| `STRIPE_PUBLIC_KEY` | Payment processing |
| `STRIPE_SECRET_KEY` | Payment processing secret |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification |
| `SENDGRID_API_KEY` | Email service (future) |

## 🗄️ Database Configuration

- **Engine**: PostgreSQL 14+
- **Cluster**: `evofit-db`
- **Database**: `evofit`
- **SSL**: Required (`DB_SSL_MODE=require`)
- **Auto-migrate**: Enabled (`AUTO_MIGRATE=true`)

## 🚨 Troubleshooting

### Common Issues

#### Docker Push Fails with Network Errors
```bash
# Solution 1: Retry after network stabilizes
docker push registry.digitalocean.com/bci/evofit:prod

# Solution 2: Re-login and retry
doctl registry login
docker push registry.digitalocean.com/bci/evofit:prod

# Solution 3: Check Docker daemon status
docker system info
```

#### Build Fails - Missing .next Directory
```bash
# Ensure Next.js build completes successfully
npm run build

# Check next.config.js settings
# Verify output directory is correct
```

#### Drizzle Config Not Found
```bash
# Ensure drizzle.config.ts exists in project root
ls -la drizzle.config.ts

# Check DATABASE_URL is set during build
echo $DATABASE_URL
```

### Deployment Status Check
```bash
# If deployment seems stuck, check status
doctl apps get <app-id>

# Check deployment logs
doctl apps logs <app-id> --type build
doctl apps logs <app-id> --type run
```

## 🔄 Deployment Workflow

1. **Code Changes**: Make changes to local codebase
2. **Test Locally**: `npm run docker:dev` to test in Docker
3. **Build**: `docker build --target prod -t evofit:prod .`
4. **Tag**: `docker tag evofit:prod registry.digitalocean.com/bci/evofit:prod`
5. **Push**: `docker push registry.digitalocean.com/bci/evofit:prod`
6. **Auto-Deploy**: DigitalOcean automatically deploys the new image
7. **Verify**: Check production URL for successful deployment

## 📝 Initial Setup Steps

### 1. Create DigitalOcean Resources

```bash
# Create Container Registry (if not exists)
doctl registry create bci --region tor1

# Create Database Cluster
doctl databases create evofit-db --engine pg --version 14 --size db-s-1vcpu-1gb --region tor1

# Create App Platform App
# Use the app spec file (create app.yaml first)
doctl apps create --spec app.yaml
```

### 2. App Specification (app.yaml)

```yaml
name: evofit-prod
region: tor
services:
- name: web
  image:
    registry_type: DOCR
    repository: evofit
    tag: prod
  http_port: 3000
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    scope: RUN_TIME
    value: ${db.DATABASE_URL}
  - key: JWT_SECRET
    scope: RUN_TIME
    type: SECRET
  - key: OPENAI_API_KEY
    scope: RUN_TIME
    type: SECRET
  - key: AWS_ACCESS_KEY_ID
    scope: RUN_TIME
    type: SECRET
  - key: AWS_SECRET_ACCESS_KEY
    scope: RUN_TIME
    type: SECRET
  - key: GOOGLE_CLIENT_ID
    scope: RUN_TIME
    type: SECRET
  - key: GOOGLE_CLIENT_SECRET
    scope: RUN_TIME
    type: SECRET
  - key: STRIPE_PUBLIC_KEY
    scope: RUN_TIME
    type: SECRET
  - key: STRIPE_SECRET_KEY
    scope: RUN_TIME
    type: SECRET
databases:
- name: db
  engine: PG
  production: true
```

### 3. Configure Secrets

```bash
# Set app environment variables
doctl apps update <app-id> --spec app.yaml

# Or set individual secrets
doctl apps config set <app-id> JWT_SECRET=<your-secret>
doctl apps config set <app-id> OPENAI_API_KEY=<your-key>
# ... etc
```

## 🎯 Pre-Deployment Checklist

- [ ] All environment variables configured in DigitalOcean
- [ ] Database created and connection tested
- [ ] Container registry created and accessible
- [ ] Domain name configured (if using custom domain)
- [ ] SSL certificate provisioned
- [ ] Dockerfile tested locally
- [ ] Database migrations tested
- [ ] Exercise database files included in build
- [ ] All API keys and secrets configured

## 🔗 MCP Integration

The following MCP servers can be used with this project:
- **GitHub MCP**: Code repository management
- **DigitalOcean MCP**: Production infrastructure management
- **Database MCP**: Direct database operations

To use the DigitalOcean MCP with Claude/Cline:
1. Ensure you have the `doctl` CLI installed and configured
2. The MCP will provide access to:
   - App management commands
   - Database operations
   - Registry management
   - Deployment monitoring

---

**Last Updated**: December 2024  
**Next Review**: After initial deployment or when infrastructure changes
