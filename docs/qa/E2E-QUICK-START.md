# E2E Testing Quick Start Guide

## Prerequisites

1. **PostgreSQL** must be running on port 5432
2. **Node.js** v18+ installed
3. **Playwright browsers** installed (run once)

```bash
# Install Playwright browsers (one-time setup)
npx playwright install chromium
```

## Running E2E Tests

### Quick Smoke Test (Recommended for validation)
```bash
# Run smoke tests on Chromium only
npx playwright test smoke.spec.ts --project=chromium
```

### Full Test Suite
```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/auth.spec.ts

# Run with UI mode (interactive)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed
```

### Debugging Tests
```bash
# Run with debug mode
npx playwright test --debug

# Run specific test with debug
npx playwright test smoke.spec.ts --debug

# Run with verbose output
npx playwright test --reporter=list
```

## Starting Servers Manually

### Backend (Port 4000)
```bash
cd backend
npm run dev:simple
```

**Health Check:**
```bash
curl http://localhost:4000/api/health
```

### Frontend (Port 3002)
```bash
npx next dev -p 3002
```

**Check Frontend:**
```bash
curl http://localhost:3002
```

## Test Reports

### View HTML Report
```bash
npx playwright show-report
```

### View Test Results
```bash
# JSON report
cat test-results/results.json

# JUnit report (for CI)
cat test-results/results.xml
```

## Common Issues

### Issue: "Port 4000 already in use"
```bash
# Find and kill process on port 4000
netstat -ano | findstr ":4000"
taskkill /PID <PID> /F
```

### Issue: "Backend health check failing"
```bash
# Check if PostgreSQL is running
netstat -ano | findstr ":5432"

# Check backend logs
tail -f backend/logs/combined.log

# Manually test health endpoint
curl http://localhost:4000/api/health
```

### Issue: "Frontend not loading"
```bash
# Clear Next.js cache
rm -rf .next

# Restart frontend
npx next dev -p 3002
```

### Issue: "Redis connection errors"
**This is expected in development!** The backend is configured to run without Redis.

- Backend will show: `⚠️ Redis connection failed, continuing without cache`
- Health check will show: `"cache": "optional"`
- Tests will continue to work normally

## Configuration

### Playwright Config (`playwright.config.ts`)
```typescript
// Base URL for tests
baseURL: 'http://localhost:3002'

// WebServer auto-start
webServer: [
  {
    command: 'npx next dev -p 3002',
    url: 'http://localhost:3002',
    timeout: 180 * 1000,
  },
  {
    command: 'cd backend && npm run dev:simple',
    url: 'http://localhost:4000/api/health',
    timeout: 180 * 1000,
  },
]
```

### Backend Port (`backend/.env`)
```env
PORT=4000
DATABASE_URL="postgresql://evofit:evofit_dev_password@localhost:5432/evofit_db"
REDIS_URL="redis://localhost:6380"  # Optional for dev
```

## Test Structure

```
tests/
├── smoke.spec.ts           # Basic functionality tests
├── auth.spec.ts            # Authentication flows
├── workouts.spec.ts        # Workout management
├── programs.spec.ts        # Program building
├── exercises.spec.ts       # Exercise library
└── analytics.spec.ts       # Progress tracking
```

## Writing New Tests

### Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate to page
    await page.goto('/some-page');
    
    // Interact with elements
    await page.click('button');
    
    // Assert expectations
    await expect(page).toHaveURL(/\/success/);
  });
});
```

### Best Practices
1. **Use data-testid attributes** for selecting elements
2. **Wait for elements** before interacting
3. **Use expect().toBeVisible()** instead of timeouts
4. **Take screenshots** on failure (automatic)
5. **Test happy path first**, then edge cases

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npx playwright test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Performance Tips

1. **Run tests in parallel** (default: 2 workers)
2. **Use `--project=chromium`** for faster feedback
3. **Disable video recording** for faster tests:
   ```typescript
   video: 'off'  // in playwright.config.ts
   ```
4. **Reuse authenticated sessions** to avoid repeated logins

## Resources

- **Playwright Docs:** https://playwright.dev
- **API Reference:** https://playwright.dev/docs/api/class-playwright
- **Best Practices:** https://playwright.dev/docs/best-practices
- **Troubleshooting:** https://playwright.dev/docs/test-runners

## Support

For issues or questions:
1. Check test logs: `test-results/`
2. Review screenshots: `test-results/*/test-failed-*.png`
3. Watch video recordings: `test-results/*/video.webm`
4. Enable debug mode: `npx playwright test --debug`
