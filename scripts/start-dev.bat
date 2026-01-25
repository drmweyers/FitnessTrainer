@echo off
REM ==========================================
REM EvoFit Trainer - Development Environment
REM Auto-startup script for local development
REM ==========================================

echo.
echo ==========================================
echo  EvoFit Trainer - Development Startup
echo ==========================================
echo.

REM Step 1: Check Docker is running
echo [1/6] Checking Docker status...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop and start it.
    pause
    exit /b 1
)
echo OK: Docker is available
echo.

REM Step 2: Start PostgreSQL database
echo [2/6] Starting PostgreSQL database...
docker start evofit-db 2>nul
if errorlevel 1 (
    echo Creating new PostgreSQL container...
    docker run --name evofit-db ^
        -e POSTGRES_USER=evofit ^
        -e POSTGRES_PASSWORD=evofit_dev_password ^
        -e POSTGRES_DB=evofit_db ^
        -p 5432:5432 ^
        -v evofit-db-data:/var/lib/postgresql/data ^
        --restart unless-stopped ^
        -d postgres:16-alpine
)
echo OK: PostgreSQL is running on port 5432
echo.

REM Step 3: Start Redis cache
echo [3/6] Starting Redis cache...
docker start evofit-redis 2>nul
if errorlevel 1 (
    echo Creating new Redis container...
    docker run --name evofit-redis ^
        -p 6380:6379 ^
        -v evofit-redis-data:/data ^
        --restart unless-stopped ^
        -d redis:7-alpine
)
echo OK: Redis is running on port 6380
echo.

REM Step 4: Wait for services to be ready
echo [4/6] Waiting for database and Redis to be ready...
timeout /t 3 /nobreak >nul
echo.

REM Step 5: Run database migrations and seed
echo [5/6] Running database migrations and seed...
cd /d "%~dp0..\backend"
call npx prisma generate
call npx prisma migrate deploy
call npm run db:seed
echo OK: Database is ready
echo.

REM Step 6: Start Backend and Frontend servers
echo [6/6] Starting development servers...
echo.
echo Starting Backend server on port 4000...
start "EvoFit Backend" cmd /k "cd /d "%~dp0..\backend" && npm run dev"
timeout /t 3 /nobreak >nul

echo Starting Frontend server on port 3001...
cd /d "%~dp0.."
start "EvoFit Frontend" cmd /k "npm run dev"

echo.
echo ==========================================
echo  Development Environment Started!
echo ==========================================
echo.
echo Services:
echo   - Backend API:  http://localhost:4000
echo   - Frontend:     http://localhost:3001
echo   - PostgreSQL:   localhost:5432
echo   - Redis:        localhost:6380
echo.
echo Test Credentials:
echo   [Admin]    admin@fitmeal.pro / AdminPass123
echo   [Trainer]  trainer.test@evofitmeals.com / TestTrainer123!
echo   [Client]   customer.test@evofitmeals.com / TestCustomer123!
echo.
echo Press any key to exit...
pause >nul
