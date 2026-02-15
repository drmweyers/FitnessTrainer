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

## Optional - Photo Uploads (Cloudinary)

Required for profile photos and progress photo uploads. Without these, photo features gracefully degrade (uploads fail with a user-friendly message).

1. Create a free account at https://cloudinary.com
2. Go to Dashboard to find your credentials
3. Set the variables:

```bash
printf 'YOUR_CLOUD_NAME' | npx vercel env add CLOUDINARY_CLOUD_NAME production
printf 'YOUR_API_KEY' | npx vercel env add CLOUDINARY_API_KEY production
printf 'YOUR_API_SECRET' | npx vercel env add CLOUDINARY_API_SECRET production
```

**Integration:** `lib/services/cloudinary.ts` - used by profile photo upload and progress photos.

## Optional - Email (Resend)

Required for password reset emails, welcome emails, and email verification. Without these, email features fail silently.

1. Create a free account at https://resend.com
2. Add and verify your domain (or use the sandbox domain for testing)
3. Create an API key
4. Set the variables:

```bash
printf 'YOUR_RESEND_KEY' | npx vercel env add RESEND_API_KEY production
printf 'noreply@yourdomain.com' | npx vercel env add EMAIL_FROM production
printf 'https://evofittrainer-six.vercel.app' | npx vercel env add NEXT_PUBLIC_APP_URL production
```

**Integration:** `lib/services/email.ts` - Resend SDK v6.9.1 with functions: sendPasswordResetEmail, sendWelcomeEmail, sendVerificationEmail.

**Note:** FitnessMealPlanner uses Mailgun, but EvoFitTrainer has Resend fully integrated. No need to switch.

## Checking Current Vars

```bash
npx vercel env ls production
```

## Important Notes

- **Never set `NODE_ENV`** in Vercel env vars - Vercel auto-sets this and adding it manually breaks `npm install`
- **Use `printf` not `echo`** for setting values - echo can add newlines
- **Vercel dashboard is authoritative** - `.env.production` file is deleted and in `.vercelignore`
- After adding vars, **redeploy** with `npx vercel --prod` or push to master (auto-deploy enabled)
