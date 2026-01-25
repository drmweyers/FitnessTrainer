# Test Credentials Helper

Manages test credentials for EvoFit Trainer development and testing.

## Test Credentials

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Admin** | admin@fitmeal.pro | AdminPass123 | Full system access |
| **Trainer** | trainer.test@evofitmeals.com | TestTrainer123! | Can manage clients |
| **Client** | customer.test@evofitmeals.com | TestCustomer123! | Regular user access |

## When to use
- Need to login during development
- Testing authentication flows
- Running E2E tests
- Verifying user permissions
- Resetting test data

## Quick Reference

### Admin Login
```
Email: admin@fitmeal.pro
Password: AdminPass123
Role: admin
```

### Trainer Login
```
Email: trainer.test@evofitmeals.com
Password: TestTrainer123!
Role: trainer
```

### Client Login
```
Email: customer.test@evofitmeals.com
Password: TestCustomer123!
Role: client
```

## Actions

### Display Test Credentials
```bash
echo "Admin: admin@fitmeal.pro / AdminPass123"
echo "Trainer: trainer.test@evofitmeals.com / TestTrainer123!"
echo "Client: customer.test@evofitmeals.com / TestCustomer123!"
```

### Verify Users Exist in Database
```bash
cd backend
npx prisma db execute --stdin <<EOF
SELECT email, role, "isActive", "isVerified" FROM "User" WHERE email LIKE '%.pro' OR email LIKE '%.com';
EOF
```

### Test Authentication with API
```bash
# Test admin login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitmeal.pro","password":"AdminPass123"}'

# Test trainer login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer.test@evofitmeals.com","password":"TestTrainer123!"}'
```

### Recreate Test Users if Needed
```bash
cd backend
npm run db:seed
```

### Reset All Test Data
```bash
cd backend
npx prisma migrate reset --force
npm run db:seed
```

## E2E Test Templates

### Playwright Login Test
```typescript
test('admin can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@fitmeal.pro');
  await page.fill('[name="password"]', 'AdminPass123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard/admin');
});
```

### Jest API Test
```typescript
describe('Auth API', () => {
  it('should authenticate admin user', async () => {
    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@fitmeal.pro',
        password: 'AdminPass123'
      })
    });
    expect(response.ok).toBe(true);
  });
});
```

## Security Notes

⚠️ **WARNING**: These credentials are for DEVELOPMENT and TESTING only!

- Never use in production
- These passwords are intentionally simple
- All test users are pre-verified (no email confirmation)
- These credentials are public in the codebase

## Production Considerations

For production, ensure:
- [ ] Test credentials are disabled
- [ ] Strong password policies enforced
- [ ] Email verification required
- [ ] Rate limiting on login endpoints
- [ ] Audit logging enabled

## Related Files
- `backend/src/config/testCredentials.ts` - Credential definitions
- `backend/prisma/seed.ts` - Seed script that creates users
- `.claude/skills/database-setup/SKILL.md` - Database setup guide

## Troubleshooting

### Login fails with "Invalid credentials"
- Verify database is seeded: `npm run db:seed`
- Check user exists in database
- Verify password hasn't been changed

### User not found
- Run seed script: `npm run db:seed`
- Check database connection
- Verify database migrations applied

### Account locked
- Reset database: `npx prisma migrate reset --force`
- Re-seed: `npm run db:seed`
