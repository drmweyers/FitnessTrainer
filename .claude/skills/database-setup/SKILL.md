# Database Setup Skill

Automated database setup for EvoFit Trainer using PostgreSQL + Docker.

## When to use
- Database not running
- Need to seed test data
- Fresh development environment
- Database connection errors

## Prerequisites
- Docker installed (recommended) or PostgreSQL installed locally
- Node.js and npm installed
- Project cloned and dependencies installed

## Actions

### 1. Check Database Status
```bash
# Check if PostgreSQL is running
docker ps | findstr evofit-db

# Or check native PostgreSQL
psql --version
netstat -an | findstr "5432"
```

### 2. Start Database Container
```bash
# Start existing container
docker start evofit-db

# Or create new container
docker run --name evofit-db ^
  -e POSTGRES_USER=evofit ^
  -e POSTGRES_PASSWORD=evofit_dev_password ^
  -e POSTGRES_DB=evofit_db ^
  -p 5432:5432 ^
  -v evofit-db-data:/var/lib/postgresql/data ^
  --restart unless-stopped ^
  -d postgres:16
```

### 3. Run Prisma Migrations
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db push
```

### 4. Execute Seed Script
```bash
cd backend
npm run db:seed
```

### 5. Verify Connectivity
```bash
# Test database connection
docker exec -it evofit-db psql -U evofit -d evofit_db -c "SELECT version();"

# Verify users created
npx prisma studio
# or
docker exec -it evofit-db psql -U evofit -d evofit_db -c "SELECT email, role FROM \"User\";"
```

## Test Credentials
After seeding, these credentials are available:
- **Admin**: admin@fitmeal.pro / AdminPass123
- **Trainer**: trainer.test@evofitmeals.com / TestTrainer123!
- **Client**: customer.test@evofitmeals.com / TestCustomer123!

## Troubleshooting

### Database won't start
```bash
# Check logs
docker logs evofit-db

# Remove and recreate
docker rm -f evofit-db
docker volume rm evofit-db-data
# Then run creation command again
```

### Port already in use
```bash
# Check what's using port 5432
netstat -ano | findstr "5432"

# Stop conflicting service or use different port
```

### Seed script fails
```bash
# Check database is running
docker ps

# Reset database
cd backend
npx prisma migrate reset --force
npm run db:seed
```

## Verification Checklist
- [ ] PostgreSQL running on localhost:5432
- [ ] evofit_db database exists
- [ ] Prisma migrations applied
- [ ] Seed script completed successfully
- [ ] Test users exist in database
- [ ] Backend can connect to database
