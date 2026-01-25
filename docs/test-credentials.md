# Test Credentials for EvoFit Development

## ⚠️ IMPORTANT: DO NOT CHANGE THESE CREDENTIALS
These test credentials must remain consistent throughout development and testing, including on production servers.

## Test Account Credentials

### 1. Admin Account
- **Email**: `admin@fitmeal.pro`
- **Password**: `AdminPass123`
- **Role**: Administrator
- **Purpose**: Full system access, admin dashboard, system configuration

### 2. Trainer Account
- **Email**: `trainer.test@evofitmeals.com`
- **Password**: `TestTrainer123!`
- **Role**: Trainer/Coach
- **Purpose**: Create programs, manage clients, view analytics

### 3. Customer/Client Account
- **Email**: `customer.test@evofitmeals.com`
- **Password**: `TestCustomer123!`
- **Role**: Client
- **Purpose**: View assigned programs, log workouts, track progress

## Usage Guidelines

1. **Development**: Use these credentials for all local testing
2. **Staging**: These accounts should exist in staging environment
3. **Production**: These accounts will be created as test accounts in production
4. **Automated Testing**: Use these credentials for E2E tests
5. **Demo**: Use trainer and client accounts for demonstrations

## Database Seeding

These accounts should be automatically created when:
- Running database migrations
- Seeding the database
- Setting up a new environment
- Running `npm run seed` or `npm run db:reset`

## Security Notes

- These are TEST accounts only
- Never use these patterns for real user accounts
- These accounts should have limited permissions in production
- Consider adding a "test account" flag in the database to identify them

## API Testing

For API testing with authentication:
```bash
# Login as trainer
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer.test@evofitmeals.com","password":"TestTrainer123!"}'

# Login as client
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer.test@evofitmeals.com","password":"TestCustomer123!"}'

# Login as admin
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitmeal.pro","password":"AdminPass123"}'
```

---
**Last Updated**: January 24, 2026
**Backend Port**: 4000
**Frontend Port**: 3001
**Do Not Modify Without Team Approval**