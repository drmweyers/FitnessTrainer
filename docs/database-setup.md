# Database Setup Guide

## Overview

This guide provides comprehensive instructions for setting up, configuring, and troubleshooting the PostgreSQL database for the EvoFit Trainer application. The database is a critical component that stores all user data, workout programs, exercises, and client information.

**Database Connection Details:**
- **Database:** PostgreSQL 16-alpine (Docker)
- **Host:** localhost
- **Port:** 5432
- **Database Name:** evofit_db
- **User:** evofit
- **Connection String:** `postgresql://evofit:evofit_dev_password@localhost:5432/evofit_db`
- **ORM:** Prisma 5.22.0

---

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Docker PostgreSQL Configuration](#docker-postgresql-configuration)
3. [Environment Configuration](#environment-configuration)
4. [Database Initialization](#database-initialization)
5. [Troubleshooting](#troubleshooting)
6. [Common Issues and Solutions](#common-issues-and-solutions)
7. [Recovery Procedures](#recovery-procedures)
8. [Maintenance and Monitoring](#maintenance-and-monitoring)

---

## Initial Setup

### Prerequisites

Before setting up the database, ensure you have the following installed:

- **Docker Desktop** (recommended) or native PostgreSQL
- **Node.js** 18+ LTS
- **npm** or **yarn**
- **Git**

### Verification Steps

Verify Docker is running:
```bash
docker ps
```

Expected output: List of running containers (may be empty initially)

---

## Docker PostgreSQL Configuration

### PostgreSQL Container Setup

The EvoFit application uses PostgreSQL running in a Docker container. Here's the verified container configuration:

**Container Details:**
- **Container Name:** fitnesstrainer-postgres
- **Image:** postgres:16-alpine
- **Port Mapping:** 0.0.0.0:5432->5432/tcp (IPv4), [::]:5432->5432/tcp (IPv6)
- **Status:** Healthy
- **Health Check:** Passing

### Start PostgreSQL Container

If the PostgreSQL container is not running, start it with:

```bash
docker start fitnesstrainer-postgres
```

### Verify Container Status

```bash
docker ps --filter name=postgres --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected output:
```
NAMES                      STATUS          PORTS
fitnesstrainer-postgres    Up 7 hours (healthy)    0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp
```

### Check Port Availability

Verify port 5432 is listening:

**Windows (PowerShell):**
```powershell
netstat -an | findstr :5432
```

**Linux/macOS:**
```bash
netstat -an | grep 5432
```

Expected output:
```
TCP    0.0.0.0:5432           0.0.0.0:0              LISTENING
TCP    [::]:5432              [::]:0                 LISTENING
```

---

## Environment Configuration

### Backend Environment Setup

The backend requires a `.env` file with database connection details.

#### Step 1: Create .env File

Navigate to the backend directory and create the `.env` file:

```bash
cd backend
cp .env.example .env
```

#### Step 2: Verify DATABASE_URL

Ensure your `.env` file contains the correct `DATABASE_URL`:

```env
DATABASE_URL="postgresql://evofit:evofit_dev_password@localhost:5432/evofit_db"
```

#### Step 3: Additional Environment Variables

Your `.env` file should also include:

```env
# Node Environment
NODE_ENV=development

# Database Connection
DATABASE_URL="postgresql://evofit:evofit_dev_password@localhost:5432/evofit_db"

# Redis (if applicable)
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Bcrypt Configuration
BCRYPT_ROUNDS=12

# Email Configuration (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Application Configuration
PORT=5000
CORS_ORIGIN=http://localhost:3000

# AWS S3 (optional)
S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### Security Note

⚠️ **IMPORTANT:** The `.env` file is included in `.gitignore` and should never be committed to the repository. Use `.env.example` as a template for other developers.

---

## Database Initialization

### Step 1: Create Database User and Database

If the database user and database don't exist, create them:

```bash
# Connect to PostgreSQL as postgres superuser
docker exec -it fitnesstrainer-postgres psql -U postgres

# In psql, execute:
CREATE USER evofit WITH PASSWORD 'evofit_dev_password';
CREATE DATABASE evofit_db OWNER evofit;
GRANT ALL PRIVILEGES ON DATABASE evofit_db TO evofit;
\q
```

### Step 2: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

Expected output:
```
✔ Generated Prisma Client (5.22.0) to ./node_modules/@prisma/client in 492ms
```

### Step 3: Push Database Schema

```bash
cd backend
npx prisma db push --accept-data-loss
```

Expected output:
```
✔ Schema synchronized with database in 2.29s
```

### Step 4: Verify Schema Creation

```bash
docker exec -it fitnesstrainer-postgres psql -U evofit -d evofit_db -c "\dt"
```

Expected output: List of all tables created by Prisma

### Step 5: Run Database Seed (Optional)

If a seed script exists:

```bash
cd backend
npx prisma db seed
```

---

## Troubleshooting

### Root Cause Analysis from Initial Setup

During the initial database setup investigation, the following issues were identified and resolved:

#### Issue 1: Prisma Version Mismatch

**Symptom:**
```
Error: Prisma CLI version mismatch
CLI: 7.2.0
@prisma/client: 5.22.0
```

**Root Cause:**
- Globally installed Prisma CLI (7.2.0) conflicted with locally installed @prisma/client (5.22.0)

**Solution:**
Use locally installed Prisma CLI instead of global:
```bash
# Use npx to run local Prisma
npx prisma db push

# Or uninstall global CLI
npm uninstall -g prisma
```

**Verification:**
```bash
cd backend
npx prisma --version
```

Expected output:
```
prisma                  : 5.22.0
@prisma/client          : 5.22.0
```

#### Issue 2: Database User and Database Do Not Exist

**Symptom:**
```
Error: P1000
Authentication failed: Authentication failed for user 'evofit'
```

**Root Cause:**
- PostgreSQL user `evofit` did not exist
- Database `evofit_db` did not exist
- This is a fresh Docker PostgreSQL installation with no custom users or databases

**Solution:**
Create the user and database:
```bash
# Connect to PostgreSQL as postgres superuser
docker exec -it fitnesstrainer-postgres psql -U postgres

# Execute SQL commands
CREATE USER evofit WITH PASSWORD 'evofit_dev_password';
CREATE DATABASE evofit_db OWNER evofit;
GRANT ALL PRIVILEGES ON DATABASE evofit_db TO evofit;

# Exit psql
\q
```

**Verification:**
```bash
# Test connection
docker exec -it fitnesstrainer-postgres psql -U evofit -d evofit_db -c "SELECT current_user, current_database();"
```

Expected output:
```
 current_user | current_database
--------------+------------------
 evofit       | evofit_db
```

#### Issue 3: backend/.env File Missing

**Symptom:**
```
Error: DATABASE_URL is not defined
```

**Root Cause:**
- The `backend/.env` file did not exist (only `.env.example` was present)
- Prisma could not find the database connection string

**Solution:**
Create `.env` from `.env.example`:
```bash
cd backend
cp .env.example .env
```

**Verification:**
```bash
cd backend
grep DATABASE_URL .env
```

Expected output:
```
DATABASE_URL="postgresql://evofit:evofit_dev_password@localhost:5432/evofit_db"
```

---

## Common Issues and Solutions

### Prisma Error Codes

| Error Code | Error Message | Root Cause | Solution |
|------------|---------------|------------|----------|
| **P1000** | Authentication failed | Incorrect credentials or user doesn't exist | Verify user exists and password is correct. Create user if missing: `CREATE USER evofit WITH PASSWORD 'evofit_dev_password';` |
| **P1001** | Can't reach database server | PostgreSQL not running or wrong port | Start PostgreSQL service or Docker container. Verify port 5432 is listening |
| **P1003** | Database does not exist | Database not created | Create database: `CREATE DATABASE evofit_db OWNER evofit;` |
| **P1006** | Connection pool exhausted | Too many connections or connection leak | Implement Prisma client singleton. Add `connection_limit` to DATABASE_URL |

### Connection Pool Exhaustion

**Symptom:**
```
Error: P1006
Connection pool exhausted
```

**Root Cause:**
- Multiple PrismaClient instances created (especially in development with hot reload)
- Connections not properly closed

**Solution:**
Ensure Prisma client singleton pattern:

```typescript
// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

Add connection limit to DATABASE_URL:
```env
DATABASE_URL="postgresql://evofit:evofit_dev_password@localhost:5432/evofit_db?connection_limit=10&pool_timeout=20"
```

### Port 5432 Already in Use

**Symptom:**
```
Error: Port 5432 is already allocated
```

**Root Cause:**
- Another PostgreSQL instance is running
- Conflicting Docker container

**Solution:**
```bash
# Find process using port 5432
netstat -an | findstr :5432

# List all PostgreSQL containers
docker ps -a | grep postgres

# Stop conflicting container
docker stop <conflicting-container-name>

# Or map Docker PostgreSQL to different port
docker run -p 5433:5432 postgres
```

### IPv4 vs IPv6 Connection Issues

**Symptom:**
```
Error: Connection refused
Error: Connection timeout
```

**Root Cause:**
- `localhost` resolving to IPv6 (::1) but PostgreSQL only listening on IPv4

**Solution:**
Use `127.0.0.1` instead of `localhost`:
```env
DATABASE_URL="postgresql://evofit:evofit_dev_password@127.0.0.1:5432/evofit_db"
```

### Migration Conflicts

**Symptom:**
```
Error: P3005
The database schema is not empty
```

**Root Cause:**
- Database already has tables but no migration history
- Manual schema changes applied

**Solution:**
```bash
# Option 1: Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Option 2: Create baseline migration
npx prisma db push
npx prisma migrate dev --name baseline --create-only

# Option 3: Resolve migration conflict
npx prisma migrate resolve --applied "migration_name"
```

### Docker Volume Loss

**Symptom:**
```
Database data missing after container restart
```

**Root Cause:**
- Docker volumes not properly mapped
- Container deleted without volume persistence

**Solution:**
Ensure volume mapping in docker-compose.yml:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres

volumes:
  postgres_data:
    driver: local
```

### Firewall Blocking Connection

**Symptom:**
```
Error: Connection timed out
Error: Connection refused
```

**Root Cause:**
- Windows Firewall blocking PostgreSQL port 5432

**Solution:**
```bash
# Windows Firewall - Add inbound rule for port 5432
netsh advfirewall firewall add rule name="PostgreSQL" dir=in action=allow protocol=TCP localport=5432

# Or temporarily disable firewall (testing only, not recommended)
netsh advfirewall set allprofiles state off
```

---

## Recovery Procedures

### Connection Pool Reset

If connection pool is exhausted or corrupted:

```bash
# Restart PostgreSQL container
docker restart fitnesstrainer-postgres

# Or restart native PostgreSQL service
# Windows:
sc restart postgresql-x64-14

# Linux:
sudo systemctl restart postgresql
```

### Migration Rollback

If a migration causes issues:

```bash
# View migration history
npx prisma migrate status

# Rollback specific migration (requires manual SQL)
npx prisma migrate resolve --rolled-back "migration_name"

# Reset to clean state (WARNING: Deletes all data)
npx prisma migrate reset
```

### Seed Data Re-run

If seed data needs to be refreshed:

```bash
cd backend

# Option 1: Run seed script
npx prisma db seed

# Option 2: Reset and re-seed
npx prisma migrate reset --force
npx prisma db seed
```

### Database Backup and Restore

**Backup:**
```bash
# Backup database to SQL file
docker exec fitnesstrainer-postgres pg_dump -U evofit evofit_db > backup.sql

# Or backup with Prisma (requires custom script)
npx ts-node scripts/backup.ts
```

**Restore:**
```bash
# Restore from SQL file
cat backup.sql | docker exec -i fitnesstrainer-postgres psql -U evofit -d evofit_db

# Or restore Prisma schema
npx prisma db push
```

### Data Corruption Recovery

If database is corrupted:

```bash
# Option 1: Re-sync schema from Prisma
npx prisma db push --accept-data-loss

# Option 2: Migrate reset and restore from backup
npx prisma migrate reset --force
cat backup.sql | docker exec -i fitnesstrainer-postgres psql -U evofit -d evofit_db

# Option 3: Manually repair with psql
docker exec -it fitnesstrainer-postgres psql -U evofit -d evofit_db
REINDEX DATABASE evofit_db;
VACUUM FULL ANALYZE;
```

---

## Maintenance and Monitoring

### Regular Maintenance Tasks

**Weekly:**
- Check database disk usage
- Review slow query logs
- Verify backup integrity

**Monthly:**
- Run `VACUUM ANALYZE` to optimize performance
- Review and update connection pool settings
- Audit user permissions

**Quarterly:**
- Test disaster recovery procedures
- Review and update documentation
- Performance tuning and index optimization

### Monitoring Commands

**Check Database Size:**
```bash
docker exec fitnesstrainer-postgres psql -U evofit -d evofit_db -c "SELECT pg_size_pretty(pg_database_size('evofit_db'));"
```

**Check Table Sizes:**
```bash
docker exec fitnesstrainer-postgres psql -U evofit -d evofit_db -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

**Check Active Connections:**
```bash
docker exec fitnesstrainer-postgres psql -U evofit -d evofit_db -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'evofit_db';"
```

**Check Long-Running Queries:**
```bash
docker exec fitnesstrainer-postgres psql -U evofit -d evofit_db -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"
```

### Performance Optimization

**Add Connection Pool Parameters:**
```env
DATABASE_URL="postgresql://evofit:evofit_dev_password@localhost:5432/evofit_db?connection_limit=10&pool_timeout=20&connect_timeout=10"
```

**Enable Query Logging (Development):**
```typescript
new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

**Create Indexes for Common Queries:**
```prisma
// In schema.prisma
model User {
  id        String   @id
  email     String   @unique
  trainerId String?

  @@index([trainerId])
}
```

---

## Connection Retry Configuration

### Retry Logic Implementation

For robust database connectivity, implement connection retry logic with exponential backoff:

```typescript
// backend/src/utils/database-retry.ts
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) throw error

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, error)

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}
```

### Customizing Retry Parameters

**Increase Retries for Unstable Networks:**
```typescript
withRetry(operation, 5, 2000) // 5 retries, 2s base delay
```

**Reduce Retries for Fast Failure:**
```typescript
withRetry(operation, 2, 500) // 2 retries, 500ms base delay
```

**Disable Retry for Critical Operations:**
```typescript
withRetry(operation, 1, 0) // No retry, fail immediately
```

---

## Best Practices

### DO ✅

- **Use singleton pattern** for Prisma client to prevent connection pool exhaustion
- **Use environment variables** for all database credentials
- **Run `npx prisma generate`** after any schema changes
- **Test database connection** before starting the application
- **Use connection pool parameters** in DATABASE_URL
- **Implement retry logic** for transient failures
- **Call `prisma.$disconnect()`** on application shutdown
- **Monitor database performance** regularly
- **Keep .env in .gitignore** to prevent credential exposure
- **Use `127.0.0.1`** instead of `localhost` if IPv6 issues occur

### DON'T ❌

- **Don't create multiple PrismaClient instances** (causes pool exhaustion)
- **Don't ignore Prisma error codes** (P1001, P1003, P1006)
- **Don't skip migrations** when schema changes
- **Don't hardcode connection strings** (use environment variables)
- **Don't omit volume mapping** in Docker Compose (causes data loss)
- **Don't assume database exists** (verify or create during setup)
- **Don't skip testing** after database changes
- **Don't use `localhost`** if it fails (try `127.0.0.1` for IPv4)
- **Don't run PostgreSQL on port 5432** if native instance conflicts (map to 5433 in Docker)
- **Don't leave connection retry logic out** (transient failures are common)

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker PostgreSQL Image](https://hub.docker.com/_/postgres)
- [Database Connection Issues](https://www.prisma.io/docs/reference/api-reference/error-reference)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-17
**Status:** Final
**Maintained By:** Backend Engineering Team
