# FitnessTrainer (EvoFit) - Project Structure

## Overview
This document describes the organizational structure of the FitnessTrainer (EvoFit) platform, explaining the purpose and contents of each directory and key files.

## Root Directory Structure

```
FitnessTrainer/
├── .bmad-core/                    # BMAD methodology configuration and agents
├── .claude/                       # Claude Code configuration
├── .github/                       # GitHub Actions workflows and templates
├── .next/                         # Next.js build output (auto-generated)
├── .git/                          # Git repository data
├── backend/                       # Node.js/Express backend application
├── docs/                          # Project documentation
├── exerciseDB/                    # Exercise database (1324 exercises with GIFs)
├── frontend/                      # Next.js frontend application (legacy structure)
├── infrastructure/                # Deployment and infrastructure configs
├── mobile/                        # React Native mobile app (Phase 3)
├── node_modules/                  # Frontend dependencies (auto-generated)
├── shared/                        # Shared utilities and types
├── src/                          # Next.js 14 application (current frontend)
├── tests/                        # End-to-end tests (Playwright)
├── package.json                  # Frontend package configuration
├── package-lock.json             # Lock file for frontend dependencies
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── next.config.js                # Next.js configuration
├── playwright.config.ts          # Playwright test configuration
├── README.md                     # Project overview and setup
├── PLANNING.md                   # Development roadmap and status
├── TASKS.md                      # Task tracking and sprint management
├── CLAUDE.md                     # Claude Code agent instructions
└── .gitignore                    # Git ignore patterns
```

## Backend Structure (`/backend`)

```
backend/
├── src/
│   ├── controllers/              # Request handlers and business logic
│   │   ├── authController.ts     # Authentication endpoints
│   │   ├── clientController.ts   # Client management endpoints
│   │   └── userController.ts     # User profile endpoints
│   ├── middleware/               # Express middleware functions
│   │   ├── auth.ts              # Authentication middleware
│   │   ├── cors.ts              # CORS configuration
│   │   ├── errorHandler.ts      # Global error handling
│   │   ├── rateLimiting.ts      # Rate limiting middleware
│   │   └── validation.ts        # Input validation middleware
│   ├── routes/                   # API route definitions
│   │   ├── auth.ts              # Authentication routes (/api/auth/*)
│   │   ├── clientRoutes.ts      # Client management (/api/clients/*)
│   │   ├── workoutRoutes.ts     # Workout programs (/api/workouts/*)
│   │   └── index.ts             # Route aggregation
│   ├── services/                # Business logic layer
│   │   ├── authService.ts       # Authentication business logic
│   │   ├── clientService.ts     # Client management business logic
│   │   ├── emailService.ts      # Email sending and templating
│   │   ├── fileUploadService.ts # File handling and storage
│   │   ├── tokenService.ts      # JWT token management
│   │   └── userService.ts       # User profile management
│   ├── utils/                   # Utility functions
│   │   ├── encryption.ts        # Password hashing and encryption
│   │   ├── validation.ts        # Zod schemas and validation
│   │   ├── constants.ts         # Application constants
│   │   └── helpers.ts           # General helper functions
│   ├── types/                   # TypeScript type definitions
│   │   ├── auth.ts             # Authentication types
│   │   ├── client.ts           # Client-related types
│   │   ├── api.ts              # API request/response types
│   │   └── index.ts            # Type exports
│   ├── tests/                   # Backend unit and integration tests
│   │   ├── auth.test.ts        # Authentication tests
│   │   ├── clientRoutes.test.ts # Client API tests
│   │   └── testSetup.ts        # Test configuration
│   └── index.ts                # Application entry point and server setup
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma          # Prisma database schema
│   ├── migrations/            # Database migration files
│   └── seed.ts               # Database seeding scripts
├── logs/                      # Application logs (not committed)
│   ├── combined.log          # All logs
│   ├── error.log            # Error logs only
│   └── exceptions.log       # Uncaught exceptions
├── uploads/                   # File uploads (not committed)
├── package.json              # Backend dependencies
├── package-lock.json         # Lock file
├── tsconfig.json            # TypeScript configuration
├── .env.example            # Environment variables template
├── .env                   # Environment variables (not committed)
└── EMAIL_SERVICE_SETUP.md # Email service configuration guide
```

## Frontend Structure (`/src`)

```
src/
├── app/                          # Next.js 14 App Router structure
│   ├── (auth)/                   # Route group for authentication
│   │   ├── login/               # Login page
│   │   │   └── page.tsx
│   │   ├── register/            # Registration page
│   │   │   └── page.tsx
│   │   └── layout.tsx          # Auth layout wrapper
│   ├── dashboard/               # Authenticated user dashboard
│   │   ├── clients/            # Client management pages
│   │   │   ├── [id]/          # Individual client pages
│   │   │   │   └── page.tsx   # Client detail view
│   │   │   ├── new/           # New client creation
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx       # Client list view
│   │   ├── programs/           # Workout program pages
│   │   ├── analytics/          # Progress and analytics
│   │   ├── settings/           # User settings
│   │   └── layout.tsx         # Dashboard layout
│   ├── api/                    # API routes (Next.js API routes)
│   │   ├── auth/              # Authentication endpoints
│   │   ├── clients/           # Client management endpoints
│   │   ├── health/            # Health check endpoints
│   │   └── webhooks/          # External service webhooks
│   ├── globals.css            # Global styles
│   ├── layout.tsx            # Root layout component
│   ├── loading.tsx           # Global loading UI
│   ├── error.tsx            # Global error UI
│   ├── not-found.tsx        # 404 page
│   └── page.tsx             # Home page
├── components/                 # Reusable React components
│   ├── auth/                  # Authentication components
│   │   ├── LoginForm.tsx     # Login form component
│   │   ├── RegisterForm.tsx  # Registration form
│   │   └── AuthGuard.tsx     # Authentication wrapper
│   ├── clients/              # Client management components
│   │   ├── ClientCard.tsx    # Client display card
│   │   ├── ClientForm.tsx    # Client creation/edit form
│   │   ├── ClientList.tsx    # Client list view
│   │   ├── ClientInviteForm.tsx # Invitation form
│   │   ├── ClientNotes.tsx   # Notes management
│   │   ├── ClientTags.tsx    # Tag management
│   │   └── TagManager.tsx    # Global tag admin
│   ├── ui/                   # Base UI components
│   │   ├── Button.tsx        # Button component
│   │   ├── Input.tsx         # Input field component
│   │   ├── Modal.tsx         # Modal dialog
│   │   ├── Card.tsx          # Card container
│   │   ├── Badge.tsx         # Badge/tag component
│   │   ├── Spinner.tsx       # Loading spinner
│   │   └── Toast.tsx         # Notification toast
│   ├── layout/               # Layout components
│   │   ├── Header.tsx        # Main navigation header
│   │   ├── Sidebar.tsx       # Dashboard sidebar
│   │   ├── Footer.tsx        # Page footer
│   │   └── Navigation.tsx    # Navigation links
│   ├── forms/                # Form components
│   │   ├── FormField.tsx     # Reusable form field
│   │   ├── SearchForm.tsx    # Search functionality
│   │   └── FilterForm.tsx    # Data filtering
│   └── charts/               # Analytics components
│       ├── ProgressChart.tsx # Progress visualization
│       ├── MetricsCard.tsx   # Metric display cards
│       └── Dashboard.tsx     # Analytics dashboard
├── lib/                       # Utility libraries and configurations
│   ├── auth.ts               # Authentication utilities
│   ├── api.ts                # API client configuration
│   ├── db.ts                 # Database connection (Prisma)
│   ├── utils.ts              # General utilities
│   ├── constants.ts          # Application constants
│   ├── validations.ts        # Form validation schemas
│   └── types.ts              # Shared TypeScript types
├── hooks/                    # Custom React hooks
│   ├── useAuth.ts           # Authentication hook
│   ├── useClient.ts         # Client management hook
│   ├── useLocalStorage.ts   # Local storage hook
│   ├── useDebounce.ts       # Debouncing hook
│   └── useApi.ts            # API interaction hook
├── context/                 # React Context providers
│   ├── AuthContext.tsx      # Authentication context
│   ├── ThemeContext.tsx     # Theme management
│   └── ClientContext.tsx    # Client data context
├── styles/                  # Styling files
│   ├── globals.css          # Global CSS styles
│   ├── components.css       # Component-specific styles
│   └── tailwind.css         # Tailwind utilities
└── types/                   # TypeScript type definitions
    ├── auth.ts             # Authentication types
    ├── client.ts           # Client-related types
    ├── api.ts             # API types
    └── index.ts           # Type exports
```

## Documentation Structure (`/docs`)

```
docs/
├── architecture/              # Technical architecture documentation
│   ├── tech-stack.md         # Technology decisions and rationale
│   ├── coding-standards.md   # Code quality and style standards
│   └── project-structure.md  # This file - project organization
├── epics/                    # BMAD epic documents
│   ├── README.md            # Epic overview and guidelines
│   ├── epic-001-user-profiles.md      # User profile system
│   ├── epic-002-authentication.md     # Authentication system
│   ├── epic-003-client-management.md  # Client management system
│   ├── epic-004-exercise-library.md   # Exercise database
│   ├── epic-005-program-builder.md    # Workout program builder
│   ├── epic-006-workout-tracking.md   # Session tracking
│   ├── epic-007-progress-analytics.md # Analytics and reporting
│   ├── epic-008-communication-messaging.md # Messaging system
│   ├── epic-009-scheduling-calendar.md # Scheduling system
│   ├── epic-010-payment-billing.md    # Payment processing
│   ├── epic-011-mobile-app-features.md # Mobile application
│   └── epic-012-admin-dashboard.md    # Administrative interface
├── implementation-reports/    # Development completion reports
│   └── epic-003-client-management-report.md # Epic 003 report
├── stories/                  # BMAD user story documents
│   └── story-001-create-basic-workout.md
├── prd.md                   # Product Requirements Document
├── architecture.md          # Main architecture document
├── businesslogic.md         # Business rules and platform guide
├── roadmap.md              # Development roadmap
├── cline-setup-guide.md    # Development setup instructions
└── next-steps.md           # Future development plans
```

## Testing Structure (`/tests`)

```
tests/
├── utils/                   # Testing utilities and helpers
│   ├── TestHelpers.ts      # Common test helper functions
│   └── fixtures/           # Test data fixtures
├── pages/                  # Page Object Model classes
│   ├── BasePage.ts         # Base page class
│   ├── LoginPage.ts        # Login page interactions
│   ├── DashboardPage.ts    # Dashboard page interactions
│   └── ClientPage.ts       # Client management interactions
├── e2e/                    # End-to-end test scenarios
│   ├── auth.spec.ts        # Authentication flows
│   ├── client-management.spec.ts # Client management features
│   ├── workout-creation.spec.ts  # Workout program creation
│   └── mobile.spec.ts      # Mobile-specific tests
├── smoke.spec.ts           # Smoke tests for basic functionality
├── performance.spec.ts     # Performance and load testing
└── accessibility.spec.ts   # Accessibility compliance tests
```

## Configuration Files

### Root Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Frontend dependencies and scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `tailwind.config.js` | Tailwind CSS customization |
| `next.config.js` | Next.js framework configuration |
| `playwright.config.ts` | End-to-end testing configuration |
| `.env.example` | Environment variables template |
| `.gitignore` | Files excluded from version control |
| `.eslintrc.json` | Code linting rules |
| `.prettierrc` | Code formatting configuration |

### Backend Configuration Files

| File | Purpose |
|------|---------|
| `backend/package.json` | Backend dependencies and scripts |
| `backend/tsconfig.json` | Backend TypeScript configuration |
| `backend/.env` | Environment variables (not committed) |
| `prisma/schema.prisma` | Database schema definition |

## Development Workflow

### File Naming Conventions

- **Components**: PascalCase (e.g., `ClientCard.tsx`)
- **Pages**: lowercase with hyphens (e.g., `client-management`)
- **Utilities**: camelCase (e.g., `authUtils.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)
- **Directories**: lowercase with hyphens (e.g., `client-management`)

### Import/Export Patterns

```typescript
// Preferred: Named exports for utilities
export { validateEmail, formatDate } from './utils';

// Default exports for components
export default function ClientCard() { }

// Barrel exports for modules
export * from './components';
export * from './services';
```

### Module Resolution

Using TypeScript path mapping defined in `tsconfig.json`:

```typescript
// Instead of relative imports
import { ClientService } from '../../../services/clientService';

// Use absolute imports
import { ClientService } from '@/services/clientService';
import { Button } from '@/components/ui/Button';
```

## Data Flow Architecture

### Frontend Data Flow
```
User Interaction → Component → Hook → API Client → Backend API
                     ↓
                  Context/State → Re-render
```

### Backend Data Flow
```
API Request → Route → Middleware → Controller → Service → Database
                        ↓
            Error Handler ← Response ← Business Logic
```

### Database Schema Organization

- **User Management**: Users, Profiles, Authentication tokens
- **Client Management**: Clients, Invitations, Notes, Tags
- **Workout System**: Programs, Exercises, Sessions, Progress
- **Communication**: Messages, Notifications, Email logs
- **Business Logic**: Billing, Subscriptions, Analytics

## Environment-Specific Configurations

### Development Environment
- Hot reloading enabled
- Detailed error messages
- Development database
- Local email testing (MailHog)
- Verbose logging

### Production Environment
- Optimized builds
- Error reporting service
- Production database
- Real email service
- Structured logging
- Performance monitoring

## Build and Deployment Structure

### Build Outputs
- `/.next/` - Next.js build cache and static files
- `/backend/dist/` - Compiled TypeScript backend
- `/coverage/` - Test coverage reports
- `/screenshots/` - Test screenshots

### Deployment Artifacts
- Docker images for containerization
- Environment-specific configuration files
- Database migration scripts
- Static asset optimization

---

This project structure supports:
- **Scalability**: Clear separation of concerns and modular organization
- **Maintainability**: Consistent patterns and documentation
- **Developer Experience**: Clear file organization and tooling integration
- **Quality Assurance**: Comprehensive testing structure
- **Documentation**: BMAD methodology compliance with thorough documentation

*This document should be updated as the project structure evolves.*