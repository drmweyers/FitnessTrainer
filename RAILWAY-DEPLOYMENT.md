# Railway Deployment Configuration

## Quick Deploy Guide

### Step 1: Open Railway Dashboard
1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"

### Step 2: Connect Repository
1. Search for your repository: `drmweyers/FitnessTrainer`
2. Select the repository
3. Click "Import"

### Step 3: Configure Services

Railway will automatically detect your services. Configure each:

#### Service 1: Backend Application
- **Root Directory**: `backend`
- **Name**: `evofit-backend`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

#### Service 2: PostgreSQL Database
- **Name**: `evofit-db`
- **Database Type**: PostgreSQL
- **Version**: 16.x
- **IP Whitelisting**: Enable (for development)

#### Service 3: Redis Cache
- **Name**: `evofit-redis`
- **Data Type**: Redis
- **Version**: 7.x

### Step 4: Environment Variables

Add these environment variables to the backend service:

```env
# Production
NODE_ENV=production

# Database (Railway provides DATABASE_URL automatically)
# Prisma will use the connection string from Railway

# Redis (Railway provides REDIS_URL automatically)
# The backend will use the connection string from Railway

# JWT Secrets (generate new secure ones for production)
JWT_ACCESS_SECRET=YOUR_PROD_JWT_ACCESS_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_PROD_JWT_REFRESH_SECRET_HERE
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Bcrypt
BCRYPT_ROUNDS=12

# CORS (update with your production frontend URL)
CORS_ORIGIN=https://evofittrainer.vercel.app

# Application
PORT=4000

# Email (configure for production)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=your-resend-api-key
EMAIL_FROM=noreply@evofit.pro

# AWS S3 (if using for file uploads)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=evofit-uploads
AWS_REGION=us-east-1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Account Security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MS=900000
```

### Step 5: Deploy

1. Click "Deploy"
2. Railway will build and deploy your services
3. Wait for deployment to complete (usually 2-5 minutes)
4. Railway will provide URLs for each service

### Step 6: Post-Deployment

#### Run Database Migrations
Railway will automatically create the database. You need to run migrations:

1. Open the backend service in Railway dashboard
2. Click "Console" to open a terminal
3. Run:
```bash
npx prisma migrate deploy
npx prisma db seed
```

#### Verify Deployment
Check the backend logs and health endpoint:
- Health Check: `https://your-backend-url.railway.app/api/health`

### Step 7: Update Frontend Environment Variables

Go to your Vercel project dashboard and add/update these environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
NEXT_PUBLIC_WS_URL=wss://your-backend-url.railway.app
```

Then redeploy the frontend:
```bash
npx vercel --prod
```

## Railway CLI Alternative

If you prefer using the CLI:

```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Add services
railway add
railway up
```

## Production Database URL

Railway automatically provides `DATABASE_URL` and `REDIS_URL`. No need to manually configure connection strings.

The Prisma client in your code will automatically use these environment variables.

## Monitoring

- **Logs**: View logs in Railway dashboard for each service
- **Metrics**: Railway provides basic metrics (CPU, memory, network)
- **Health Checks**: Railway monitors service health and restarts if needed

## Troubleshooting

### Service Not Starting
1. Check build logs in Railway dashboard
2. Verify environment variables are set
3. Check that all dependencies are in package.json

### Database Connection Issues
1. Verify DATABASE_URL is set by Railway
2. Run migrations manually via Railway console
3. Check Redis connection

### Redis Connection Issues
1. Verify REDIS_URL is set by Railway
2. Check Redis service is running
3. Verify Redis client configuration

## Scaling

Railway automatically scales your services:
- **Backend**: Auto-scales based on traffic
- **Database**: Managed scaling (depends on plan)
- **Redis**: Managed scaling (depends on plan)

## Cost Estimate

- **Starter Plan** (Free): ~$5/month after trial
- **Usage-based**: Pay for actual usage
- **Database**: Managed PostgreSQL with auto-backups
- **Redis**: Managed Redis with persistence

## Support

- Railway Documentation: https://docs.railway.app
- Community Support: https://community.railway.app
- Support Email: support@railway.app
