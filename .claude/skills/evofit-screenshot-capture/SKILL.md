# EvoFit Screenshot Capture

## Description
Automated screenshot capture workflow for EvoFit production site using Playwright.

## When to Use
- After UI updates to refresh marketing materials
- When adding new pages or features
- For documentation and help file illustrations
- For marketing material creation

## Production URL
https://evofittrainer-six.vercel.app

## Credentials
Check tests/e2e/ for current test credentials.
Roles needed: Trainer, Client, Admin

## Viewport Sizes
- Desktop: 1440x900
- Mobile: 390x844 (iPhone 14 Pro)

## Screenshot Directory
docs/marketing/screenshots/
- public/ (unauthenticated pages)
- trainer/ (trainer role pages)
- client/ (client role pages)
- admin/ (admin role pages)

## Naming Convention
[section]/[page-name]-[viewport].png
Example: trainer/dashboard-desktop.png

## Complete Page List

### Public Pages (no auth)
| Page | URL | Desktop | Mobile |
|------|-----|---------|--------|
| Homepage | / | Yes | Yes |
| Login | /auth/login | Yes | No |
| Register | /auth/register | Yes | No |
| Exercises | /exercises | Yes | No |

### Trainer Pages (auth as trainer)
| Page | URL | Desktop | Mobile |
|------|-----|---------|--------|
| Dashboard | /dashboard | Yes | Yes |
| Trainer Dashboard | /dashboard/trainer | Yes | No |
| Client List | /trainer/clients | Yes | No |
| Client Detail | /trainer/clients/[id] | Yes | No |
| Exercise Library | /dashboard/exercises | Yes | No |
| Programs | /programs | Yes | No |
| Program Create | /programs/new | Yes | No |
| Workouts | /workouts | Yes | No |
| Workout Builder | /workouts/builder | Yes | No |
| Workout Tracker | /workout-tracker | Yes | No |
| Analytics | /analytics | Yes | Yes |
| Schedule | /schedule | Yes | No |
| Profile | /profile | Yes | No |
| Profile Edit | /profile/edit | Yes | No |

### Admin Pages (auth as admin)
| Page | URL | Desktop | Mobile |
|------|-----|---------|--------|
| Dashboard | /admin | Yes | No |
| Users | /admin/users | Yes | No |
| System Health | /admin/system | Yes | No |

### Client Pages (auth as client)
| Page | URL | Desktop | Mobile |
|------|-----|---------|--------|
| Dashboard | /dashboard/client | Yes | No |

## Capture Process
1. Use Playwright CLI or browser automation
2. Navigate to login, authenticate
3. For each page: navigate, wait networkidle, screenshot
4. Save with naming convention
5. Update docs/marketing/screenshot-inventory.md

## Inventory File
After capture, update docs/marketing/screenshot-inventory.md with all screenshots.
