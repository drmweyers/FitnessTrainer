# Vercel Backend Deployment Guide

## Overview

Deploy your Express.js backend to Vercel as serverless functions. This keeps both frontend and backend on the same platform with automatic deployments.

## Architecture

### Current Setup
```
Frontend: Vercel ✅
Backend: Express.js (local only)
Database: PostgreSQL (Docker)
Redis: Redis (Docker)
```

### Target Setup
```
Frontend: Vercel ✅
Backend: Vercel Serverless Functions ✅
Database: Vercel Postgres (Neon) ✅
Redis: Upstash Redis ✅
```

## Migration Strategy

### Option 1: Minimal Changes (Recommended)
Keep Express middleware structure, wrap for Vercel compatibility.

### Option 2: Full Rewrite
Convert to Next.js Route Handlers (more native, but more work).

---

## Step-by-Step Deployment

### Step 1: Install Vercel Dependencies

```bash
npm install --save-dev @vercel/node
```

### Step 2: Create API Route Structure

Move your Express API routes to Next.js API routes:

```
backend/src/api/
├── auth/
│   ├── login/
│   │   └── route.ts
│   ├── register/
│   │   └── route.ts
│   └── logout/
│       └── route.ts
├── workouts/
│   └── route.ts
├── users/
│   └── route.ts
└── exercises/
    └── route.ts
```

### Step 3: Convert Express Middleware

Express middleware needs to be converted to Next.js middleware format:

**Express:**
```typescript
app.use('/api/auth', authRouter);
```

**Next.js API Route:**
```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loginHandler } from '@/backend/src/handlers/authHandler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await loginHandler(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
```

### Step 4: Database Configuration

**Option A: Vercel Postgres (Recommended)**

```bash
npm install @vercel/postgres
```

```typescript
// lib/db.ts
import { sql } from '@vercel/postgres';

export async function getUser(email: string) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;
  return result.rows[0];
}
```

**Option B: Keep Prisma with Vercel**

```bash
npm install prisma @prisma/adapter-planetscale
```

Update Prisma schema to use Vercel Postgres connection string.

### Step 5: Redis Configuration

Use Upstash Redis (free tier, Vercel integration):

```bash
npm install @upstash/redis
```

```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

### Step 6: Environment Variables

Add these in Vercel Dashboard > Settings > Environment Variables:

```env
# Database
DATABASE_URL=postgresql://...

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Auth
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret

# CORS
NEXT_PUBLIC_API_URL=https://evofittrainer.vercel.app/api
```

### Step 7: Update vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Step 8: Deploy

```bash
# Commit changes
git add .
git commit -m "feat: migrate backend to Vercel serverless"
git push origin master

# Vercel auto-deploys on push
```

---

## Vercel Postgres Setup

### 1. Create Database

1. Go to Vercel Dashboard
2. Select your project (evofittrainer)
3. Go to Storage tab
4. Click "Create Database"
5. Select "Postgres" (powered by Neon)
6. Choose region (closest to your users)
7. Click "Create"

### 2. Link to Project

Vercel automatically adds `DATABASE_URL` to your environment variables.

### 3. Run Migrations

```bash
# Via Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy
```

---

## Upstash Redis Setup

### 1. Create Redis Database

1. Go to https://upstash.com
2. Sign up/Login
3. Create new Redis database
4. Select region (same as Vercel Postgres)
5. Click "Create"

### 2. Get Credentials

1. Open your Redis database
2. Go to "Details" tab
3. Copy REST API URL and Token
4. Add to Vercel environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Install Integration

```bash
# In Vercel project
npm install @upstash/redis
```

---

## Migration Script Example

```typescript
// scripts/migrate-to-vercel.ts
import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

async function migrateUsers() {
  // Migrate users from existing database
  const users = await sql`SELECT * FROM users`;

  for (const user of users) {
    await sql`
      INSERT INTO users (id, email, password_hash, role)
      VALUES (${user.id}, ${user.email}, ${user.password_hash}, ${user.role})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  console.log(`Migrated ${users.length} users`);
}

migrateUsers();
```

---

## Testing the Deployment

### 1. Test API Endpoints

```bash
# Health check
curl https://evofittrainer.vercel.app/api/health

# Login test
curl -X POST https://evofittrainer.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer.test@evofitmeals.com","password":"TestTrainer123!"}'
```

### 2. Test Database Connection

```typescript
// app/api/health/route.ts
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`SELECT NOW()`;
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      time: result.rows[0]
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Cost Comparison

### Vercel Full Stack (Current Plan)
- **Hobby Plan**: FREE
  - 100GB bandwidth/month
  - 100GB hours of serverless function execution
  - 60-second execution timeout
  - Vercel Postgres: 256MB storage (free)
  - Upstash Redis: 10,000 commands/day (free)

### Pro Plan (if needed)
- **Pro Plan**: $20/month
  - 1TB bandwidth
  - 1000GB hours
  - 900-second execution timeout
  - Vercel Postgres: 1GB storage
  - Priority support

---

## Troubleshooting

### Issue: Function Timeout
**Solution**: Enable longer timeouts in vercel.json
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### Issue: Database Connection Pool Exhausted
**Solution**: Use connection pooling with Vercel Postgres
```typescript
import { drizzle } from '@vercel/postgres/kysely';
```

### Issue: Redis Commands Fail
**Solution**: Check Upstash credentials in Vercel environment variables
```bash
vercel env ls
```

---

## Advantages of Vercel Backend

✅ **Single Platform**: Frontend + backend on Vercel
✅ **Auto Deployments**: Push to git = auto deploy
✅ **Auto Scaling**: Serverless functions scale automatically
✅ **Zero Config**: No server management
✅ **Fast**: Global edge network
✅ **Free Tier**: Generous free tier for development
✅ **Preview Deployments**: Test each PR before merging

---

## Next Steps

1. ✅ Create Vercel Postgres database
2. ✅ Create Upstash Redis database
3. ✅ Convert Express routes to Next.js API routes
4. ✅ Update environment variables in Vercel
5. ✅ Run database migrations
6. ✅ Test API endpoints
7. ✅ Deploy to production

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres
- Upstash Redis: https://upstash.com/docs

---

**Last Updated**: January 24, 2026
**Project**: EvoFit Trainer
**Platform**: Vercel
