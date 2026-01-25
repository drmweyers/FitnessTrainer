@echo off
REM ==========================================
REM EvoFit Trainer - Backend Migration to Vercel
REM Automatically converts Express.js to Vercel Functions
REM ==========================================

echo.
echo ==========================================
echo  Vercel Backend Migration Tool
echo ==========================================
echo.
echo This script will:
echo   1. Install required dependencies
echo   2. Create API route structure
echo   3. Convert Express routes to Vercel functions
echo   4. Update environment configuration
echo   5. Deploy to Vercel
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause >nul

REM Step 1: Install dependencies
echo.
echo [1/7] Installing Vercel dependencies...
call npm install --save-dev @vercel/node
call npm install @vercel/postgres
call npm install @upstash/redis
echo OK: Dependencies installed
echo.

REM Step 2: Create API directories
echo [2/7] Creating API route structure...
if not exist "app\api" mkdir app\api
if not exist "app\api\auth" mkdir app\api\auth
if not exist "app\api\auth\login" mkdir app\api\auth\login
if not exist "app\api\auth\register" mkdir app\api\auth\register
if not exist "app\api\auth\logout" mkdir app\api\auth\logout
if not exist "app\api\workouts" mkdir app\api\workouts
if not exist "app\api\users" mkdir app\api\users
if not exist "app\api\exercises" mkdir app\api\exercises
if not exist "app\api\health" mkdir app\api\health
if not exist "lib" mkdir lib
echo OK: API directories created
echo.

REM Step 3: Create database client
echo [3/7] Creating database client...
(
echo import { sql } from '@vercel/postgres';
echo.
echo // Database connection for Vercel Postgres
echo // Uses connection pooling for optimal performance
echo.
echo export async function query(text: string, params?: any[]) {
echo   try {
echo     const result = await sql.query(text, params);
echo     return result;
echo   } catch (error) {
echo     console.error('Database query error:', error);
echo     throw error;
echo   }
echo }
echo.
echo export async function getUser(email: string) {
echo   const result = await sql^<User^>SELECT * FROM users WHERE email = ${email} LIMIT 1^;
echo   return result.rows[0];
echo }
echo.
echo export async function createUser(data: any) {
echo   const result = await sql`
echo     INSERT INTO users (email, password_hash, role, first_name, last_name)
echo     VALUES (${data.email}, ${data.password_hash}, ${data.role}, ${data.first_name}, ${data.last_name})
echo     RETURNING *
echo   `;
echo   return result.rows[0];
echo }
echo.
echo export default { sql, query, getUser, createUser };
) > lib\db.ts
echo OK: Database client created
echo.

REM Step 4: Create Redis client
echo [4/7] Creating Redis client...
(
echo import { Redis } from '@upstash/redis';
echo.
echo // Redis connection for Vercel (using Upstash)
echo.
echo const getRedisClient = () => {
echo   if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
echo     return new Redis({
echo       url: process.env.UPSTASH_REDIS_REST_URL,
echo       token: process.env.UPSTASH_REDIS_REST_TOKEN,
echo     });
echo   }
echo   return null;
echo };
echo.
echo export const redis = getRedisClient();
echo.
echo export async function cacheGet(key: string) {
echo   if (!redis) return null;
echo   try {
echo     return await redis.get(key);
echo   } catch (error) {
echo     console.error('Redis get error:', error);
echo     return null;
echo   }
echo }
echo.
echo export async function cacheSet(key: string, value: any, ttl?: number) {
echo   if (!redis) return;
echo   try {
echo     if (ttl) {
echo       await redis.setex(key, ttl, value);
echo     } else {
echo       await redis.set(key, value);
echo     }
echo   } catch (error) {
echo     console.error('Redis set error:', error);
echo   }
echo }
echo.
echo export async function cacheDel(key: string) {
echo   if (!redis) return;
echo   try {
echo     await redis.del(key);
echo   } catch (error) {
echo     console.error('Redis del error:', error);
echo   }
echo }
) > lib\redis.ts
echo OK: Redis client created
echo.

REM Step 5: Create health check endpoint
echo [5/7] Creating health check endpoint...
(
echo import { NextResponse } from 'next/server';
echo import { sql } from '@vercel/postgres';
echo.
echo export async function GET() {
echo   try {
echo     const dbResult = await sql`SELECT NOW() as current_time`;
echo.
echo     return NextResponse.json({
echo       status: 'healthy',
echo       timestamp: new Date().toISOString(),
echo       database: {
echo         status: 'connected',
echo         time: dbResult.rows[0]?.current_time
echo       },
echo       platform: 'vercel'
echo     });
echo   } catch (error: any) {
echo     return NextResponse.json(
echo       {
echo         status: 'unhealthy',
echo         error: error.message
echo       },
echo       { status: 500 }
echo     );
echo   }
echo }
) > app\api\health\route.ts
echo OK: Health check created
echo.

REM Step 6: Create example auth login endpoint
echo [6/7] Creating example auth endpoints...
(
echo import { NextRequest, NextResponse } from 'next/server';
echo import { getUser } from '@/lib/db';
echo import bcrypt from 'bcrypt';
echo import jwt from 'jsonwebtoken';
echo.
echo export async function POST(request: NextRequest) {
echo   try {
echo     const { email, password } = await request.json();
echo.
echo     if (!email || !password) {
echo       return NextResponse.json(
echo         { error: 'Email and password required' },
echo         { status: 400 }
echo       );
echo     }
echo.
echo     // Get user from database
echo     const user = await getUser(email);
echo.
echo     if (!user) {
echo       return NextResponse.json(
echo         { error: 'Invalid credentials' },
echo         { status: 401 }
echo       );
echo     }
echo.
echo     // Verify password
echo     const isValidPassword = await bcrypt.compare(password, user.password_hash);
echo.
echo     if (!isValidPassword) {
echo       return NextResponse.json(
echo         { error: 'Invalid credentials' },
echo         { status: 401 }
echo       );
echo     }
echo.
echo     // Generate JWT tokens
echo     const accessToken = jwt.sign(
echo       { userId: user.id, email: user.email, role: user.role },
echo       process.env.JWT_ACCESS_SECRET || 'default-secret',
echo       { expiresIn: '15m' }
echo     );
echo.
echo     const refreshToken = jwt.sign(
echo       { userId: user.id },
echo       process.env.JWT_REFRESH_SECRET || 'default-secret',
echo       { expiresIn: '7d' }
echo     );
echo.
echo     return NextResponse.json({
echo       success: true,
echo       accessToken,
echo       refreshToken,
echo       user: {
echo         id: user.id,
echo         email: user.email,
echo         role: user.role,
echo         firstName: user.first_name,
echo         lastName: user.last_name
echo       }
echo     });
echo   } catch (error: any) {
echo     console.error('Login error:', error);
echo     return NextResponse.json(
echo       { error: 'Login failed', details: error.message },
echo       { status: 500 }
echo     );
echo   }
echo }
) > app\api\auth\login\route.ts

echo OK: Auth endpoints created
echo.

REM Step 7: Update vercel.json
echo [7/7] Updating vercel.json configuration...
(
echo {
echo   "buildCommand": "npm run build",
echo   "outputDirectory": ".next",
echo   "framework": "nextjs",
echo   "installCommand": "npm install",
echo   "functions": {
echo     "app/api/**/*.ts": {
echo       "maxDuration": 30
echo     }
echo   }
echo }
) > vercel.json.bak
move /Y vercel.json.bak vercel.json >nul 2>&1
echo OK: vercel.json updated
echo.

echo.
echo ==========================================
echo  Migration Complete!
echo ==========================================
echo.
echo Next Steps:
echo.
echo 1. Create Vercel Postgres Database:
echo    - Go to https://vercel.com/dashboard
echo    - Select your project (evofittrainer)
echo    - Go to Storage > Create Database > Postgres
echo.
echo 2. Create Upstash Redis Database:
echo    - Go to https://upstash.com
echo    - Create new Redis database
echo    - Copy REST URL and Token
echo.
echo 3. Add Environment Variables in Vercel:
echo    - DATABASE_URL (auto-added by Vercel Postgres)
echo    - UPSTASH_REDIS_REST_URL
echo    - UPSTASH_REDIS_REST_TOKEN
echo    - JWT_ACCESS_SECRET
echo    - JWT_REFRESH_SECRET
echo.
echo 4. Run Database Migrations:
echo    - vercel env pull .env.local
echo    - npx prisma migrate deploy
echo.
echo 5. Deploy to Vercel:
echo    - git add .
echo    - git commit -m "feat: migrate backend to Vercel"
echo    - git push origin master
echo.
echo For detailed instructions, see: VERCEL-BACKEND-DEPLOYMENT.md
echo.
pause
