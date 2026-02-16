# Environment Variables Setup Guide

## Currently Set (Production - Vercel)

| Variable | Status | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | SET | Neon PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | SET | JWT access token signing |
| `JWT_REFRESH_SECRET` | SET | JWT refresh token signing |
| `JWT_ACCESS_EXPIRE` | SET (`15m`) | Access token expiry |
| `JWT_REFRESH_EXPIRE` | SET (`7d`) | Refresh token expiry |
| `UPSTASH_REDIS_REST_URL` | SET | Redis cache URL |
| `UPSTASH_REDIS_REST_TOKEN` | SET | Redis auth token |
| `CORS_ORIGIN` | SET | Allowed CORS origins |
| `MAILGUN_API_KEY` | SET | Mailgun email API key (shared with FitnessMealPlanner) |
| `MAILGUN_DOMAIN` | SET | Mailgun sending domain (`evofitmeals.com`) |
| `EMAIL_FROM` | SET | Email from address |
| `NEXT_PUBLIC_APP_URL` | SET | App URL for email links |

## Email (Mailgun) - CONFIGURED

Uses the same Mailgun account as FitnessMealPlanner (evofitmeals.com domain).
No SDK needed - uses `fetch` to Mailgun HTTP API directly.

**Integration:** `lib/services/email.ts` - Functions: sendPasswordResetEmail, sendWelcomeEmail, sendVerificationEmail, sendClientInvitationEmail.

## Photo Uploads - DEFERRED (Post-MVP)

Photo uploads (profile photos, progress photos) are stubbed out and return "coming soon" (HTTP 501). This avoids ongoing costs from cloud storage services. Will be implemented post-launch with a free-tier solution.

## Checking Current Vars

```bash
npx vercel env ls production
```

## Important Notes

- **Never set `NODE_ENV`** in Vercel env vars - Vercel auto-sets this and adding it manually breaks `npm install`
- **Use `printf` not `echo`** for setting values - echo can add newlines
- **Vercel dashboard is authoritative** - `.env.production` file is deleted and in `.vercelignore`
- After adding vars, **redeploy** with `npx vercel --prod` or push to master (auto-deploy enabled)
