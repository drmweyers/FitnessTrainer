# EvoFit Fitness - Personal Training Platform

A comprehensive platform for personal trainers to manage clients, create programs, and track progress.

## 📊 Current Status (January 2025)
- ✅ **Epic 001**: User Profiles - COMPLETED
- ✅ **Epic 002**: Authentication System - COMPLETED  
- ✅ **Epic 003**: Client Management - COMPLETED (Full Stack + Testing)
- 🎯 **Next**: Epic 004 (Exercise Library) - Database connection issue needs resolution
- 📚 **Documentation**: Complete BMAD compliance (50+ pages)
- 🖥️ **Frontend**: Professional UI with EvoFit branding - FULLY FUNCTIONAL
- ⚠️ **Backend**: PostgreSQL connection issue (blocking data)

## Features
- 👤 User authentication and profiles
- 👥 Client management system
- 💪 Exercise library with 1300+ exercises
- 📋 Program builder with templates
- 📱 Workout tracking with timers
- 📊 Progress analytics and insights
- 💬 In-app messaging
- 📅 Scheduling and calendar
- 💳 Payment processing
- 📱 Native mobile apps

## Project Structure
```
FitnessTrainer/
├── frontend/          # Next.js web application
├── backend/           # Node.js/Express API
├── mobile/           # React Native mobile app
├── shared/           # Shared types and utilities
├── infrastructure/   # Docker, deployment configs
├── docs/             # Documentation and BMAD
└── exerciseDB/       # Exercise database assets
```

## Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL, Redis
- **Mobile**: React Native
- **Authentication**: JWT with refresh tokens
- **Payments**: Stripe
- **Real-time**: WebSockets
- **Infrastructure**: Docker, AWS/Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional for development)

### Development Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. Set up environment variables (see `.env.example` in each directory)

4. Run database migrations:
   ```bash
   cd backend
   npx prisma migrate dev
   ```

5. Start development servers:
   ```bash
   # Backend (from backend/)
   npm run dev
   
   # Frontend (from frontend/)
   npm run dev
   ```

## Documentation
- [Product Requirements](docs/prd.md)
- [Architecture](docs/architecture.md)
- [API Documentation](docs/api/README.md)
- [Development Guide](docs/cline-setup-guide.md)

## License
Proprietary - All rights reserved
