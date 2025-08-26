# FitnessTrainer (EvoFit) - Development Quick Start Guide

## 🚀 Current Status
- **Phase**: Development (Authentication Implementation)
- **BMAD**: Complete ✅
- **Deployment Docs**: Ready ✅
- **Decision**: Build first, deploy later

## 📍 Where We Left Off (December 25, 2024)
- Project structure is created
- Backend has basic package.json (no dependencies yet)
- Frontend directory exists but no code
- Ready to implement Epic 002: Authentication System

## 🎯 Next Development Steps

### 1. Backend Authentication Setup
```bash
cd backend

# Install dependencies
npm install express cors helmet morgan compression
npm install -D typescript @types/node @types/express nodemon ts-node
npm install jsonwebtoken bcrypt zod dotenv
npm install -D @types/jsonwebtoken @types/bcrypt
npm install @prisma/client
npm install -D prisma

# Initialize TypeScript
npx tsc --init

# Initialize Prisma
npx prisma init
```

### 2. Frontend Setup
```bash
cd ../frontend

# Create Next.js app with TypeScript and Tailwind
npx create-next-app@latest . --typescript --tailwind --app --use-npm

# Install additional dependencies
npm install axios jotai @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react
```

### 3. Database Setup (Local PostgreSQL)
```bash
# Option A: Using Docker
docker run --name evofit-db -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=evofit -p 5432:5432 -d postgres:14

# Option B: Using local PostgreSQL
# Create database manually: CREATE DATABASE evofit;

# Update .env file with:
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/evofit"
```

## 📝 Key Files to Reference
- **Epic 002**: `/docs/epics/epic-002-authentication.md` - Authentication requirements
- **Architecture**: `/docs/architecture.md` - System design
- **Tasks**: `/TASKS.md` - Current task list
- **Planning**: `/PLANNING.md` - Project roadmap

## 🔧 Development Workflow

### For Authentication Implementation:
1. Set up Prisma schema from Epic 002
2. Create JWT service utilities
3. Build auth endpoints (register, login, refresh)
4. Create frontend auth components
5. Implement protected routes
6. Add form validation
7. Test authentication flow

### Git Commands:
```bash
git checkout -b feature/authentication
# Make changes
git add .
git commit -m "feat(auth): implement JWT authentication"
git push origin feature/authentication
```

## 🚢 When Ready to Deploy

### Prerequisites:
- [ ] Basic authentication working
- [ ] Frontend and backend connected
- [ ] Environment variables defined
- [ ] Tests passing

### Deployment Steps:
1. Create Dockerfile
2. Run deployment setup script: `.\scripts\deploy-setup.ps1`
3. Configure secrets in DigitalOcean
4. Build and push Docker image
5. Monitor deployment

See `DO_DEPLOYMENT_GUIDE.md` for detailed instructions.

## 📊 Project Structure
```
FitnessTrainer/
├── backend/           # Express API (needs setup)
├── frontend/          # Next.js app (needs creation)
├── docs/             
│   ├── epics/        # 12 epic documents
│   ├── architecture.md
│   ├── CLAUDE.md
│   └── SESSION_SUMMARY_2024-12-25.md
├── scripts/          # Deployment scripts
├── exerciseDB/       # 1324 exercises
├── PLANNING.md       # Project roadmap
├── TASKS.md          # Current tasks
├── DO_DEPLOYMENT_GUIDE.md
└── app.yaml          # DigitalOcean config
```

## 🔑 Environment Variables Needed
```env
# Backend (.env)
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:3000

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 💡 Quick Tips
- Start with minimal authentication (register/login)
- Use Prisma Studio to view database: `npx prisma studio`
- Test API with Postman or Thunder Client
- Keep authentication simple initially, enhance later
- Document API endpoints as you build them

## 🆘 Common Issues
- **Port conflicts**: Backend on 3001, Frontend on 3000
- **CORS errors**: Configure Express CORS middleware
- **Database connection**: Check PostgreSQL is running
- **TypeScript errors**: Ensure types are installed

---

Ready to continue? Start with the backend authentication setup!
