# Setting Up FitnessTrainer (EvoFit) with Cline

## Recommended First Steps

### 1. **Initialize the Project Structure** (Do this first!)

Before using Cline to build features, set up the basic project structure:

```bash
# You're already in the FitnessTrainer directory
# Let's create the project structure

# Create main directories
mkdir -p frontend
mkdir -p backend
mkdir -p mobile
mkdir -p shared
mkdir -p infrastructure

# Initialize Git
git init
```

### 2. **Create Foundation Files**

Create these essential files that will guide Cline:

#### `.gitignore`
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/

# Production
build/
dist/

# Misc
.DS_Store
*.pem
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
Thumbs.db
```

#### `README.md`
```markdown
# EvoFit - Personal Training Platform

A comprehensive platform for personal trainers to manage clients, create programs, and track progress.

## Project Structure
- `/frontend` - Next.js web application
- `/backend` - Node.js/Express API
- `/mobile` - React Native mobile app
- `/shared` - Shared types and utilities
- `/infrastructure` - Docker, deployment configs
- `/docs` - Documentation and BMAD

## Getting Started
See `/docs/cline-setup-guide.md` for development setup.
```

### 3. **Initialize Backend First**

Start with the backend as it's the foundation:

```bash
cd backend
npm init -y

# Install core dependencies
npm install express cors dotenv bcrypt jsonwebtoken
npm install @types/node @types/express typescript ts-node nodemon -D
npm install prisma @prisma/client
npm install zod express-validator

# Create TypeScript config
npx tsc --init
```

### 4. **Create Initial Backend Structure**

Create these files to guide Cline:

#### `backend/src/server.ts`
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 5. **Set Up Database Schema**

Initialize Prisma with the schema from your epics:

```bash
cd backend
npx prisma init
```

Then create the initial schema based on Epic 002 (Authentication).

## How to Use Cline Effectively

### Phase 1: Authentication System (Epic 002)

When you start with Cline, give it this context:

```
"I need to implement the authentication system based on Epic 002 in /docs/epics/epic-002-authentication.md. 

Start by:
1. Setting up the Prisma schema for users, sessions, and authentication tables
2. Creating the authentication service with JWT
3. Implementing the /api/auth/register endpoint
4. Adding input validation with Zod

Use the database schema from the epic document and follow the security requirements listed."
```

### Phase 2: Progressive Development

After authentication, follow this order:
1. User Profiles (Epic 001) - Basic profile structure
2. Database seeding - Import exercise database
3. Exercise Library API (Epic 004) - Read-only endpoints first
4. Frontend setup - Next.js with authentication

### Best Practices for Cline

1. **Give Clear Context**: Always reference the epic documents
2. **Work in Small Chunks**: One user story at a time
3. **Test as You Go**: Ask Cline to create tests alongside features
4. **Use the Schemas**: The database schemas in epics are your blueprint
5. **Reference the Architecture**: Point Cline to the architecture document

### Example Cline Prompts

#### For Authentication:
```
"Implement the user registration endpoint from Epic 002. Use the users table schema provided, implement password hashing with bcrypt, and add Zod validation for email and password. Include proper error handling and follow the security requirements."
```

#### For Database Setup:
```
"Create the Prisma schema for the authentication system based on the database tables in epic-002-authentication.md. Include the users, email_verifications, password_resets, and user_sessions tables."
```

#### For API Development:
```
"Create the Express router for authentication endpoints listed in Epic 002. Follow RESTful conventions and include proper TypeScript types."
```

## Recommended Development Order

1. **Week 1**: Backend Foundation
   - Project setup ✓
   - Database schema
   - Authentication API
   - Basic tests

2. **Week 2**: Frontend Foundation  
   - Next.js setup
   - Authentication UI
   - Protected routes
   - Basic layout

3. **Week 3**: Exercise Database
   - Import scripts
   - Exercise API endpoints
   - Search functionality

4. **Week 4**: User Profiles
   - Profile API
   - Profile UI
   - Image upload

5. **Weeks 5-8**: Core Features
   - Client management
   - Program builder basics
   - Workout tracking MVP

## Tips for Success

1. **Start Simple**: Get basic authentication working before adding 2FA
2. **Use TypeScript**: It helps Cline generate better code
3. **Test Early**: Ask Cline to write tests as features are built
4. **Document as You Go**: Have Cline update API docs
5. **Regular Commits**: Commit working code frequently

## Next Immediate Action

Run these commands to get started:

```bash
# In the FitnessTrainer root directory
npm init -y
npm install --save-dev @types/node typescript

# Create the backend
cd backend
npm init -y
npm install express cors dotenv bcrypt jsonwebtoken prisma @prisma/client
npm install -D @types/express @types/node typescript ts-node nodemon

# Initialize Prisma
npx prisma init

# Then use Cline to create the authentication system!
```
