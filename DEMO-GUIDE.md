# EvoFit Trainer - Demo Quick Start Guide

## 🚀 Starting the Demo

### Prerequisites
- Node.js installed
- Database: Neon PostgreSQL (already configured)
- No Docker or Redis required

### Step 1: Start the Frontend
```bash
cd C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer
npm run dev
```
Frontend runs on: **http://localhost:3000**

### Step 2: Start the Backend (Optional - for full API features)
```bash
cd C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer\backend
npm run dev
```
Backend API runs on: **http://localhost:5000**

## 🔑 Demo Login Credentials

### Trainer Account (Full Access)
- **Email**: trainer@evofit.com
- **Password**: Test123!

### Client Account (Limited Access)
- **Email**: client@evofit.com
- **Password**: Test123!

## 📊 Demo Features Available

### ✅ Exercise Library
- **1,324 real exercises** imported
- Visit: http://localhost:3000/exercises
- Filter by type, muscle group, equipment

### ✅ Sample Workout Programs
- **3 complete programs** with 76 total workouts:
  1. **Beginner Full Body** - 4 weeks, 3 days/week
  2. **Muscle Building - Hypertrophy** - 6 weeks, 4 days/week
  3. **Athletic Performance** - 8 weeks, 5 days/week
- Visit: http://localhost:3000/programs

### ✅ Trainer Dashboard
- Client management
- Program assignment
- Analytics and reporting
- Visit: http://localhost:3000/dashboard/trainer

### ✅ Workout Tracking
- Log workout sessions
- Track progress
- View personal records
- Visit: http://localhost:3000/workouts

## 🎯 Demo Script

### For Trainers:
1. **Login** with trainer account
2. **Browse Exercise Library** - Show 1,324+ exercises
3. **View Sample Programs** - Show 3 ready-made programs
4. **Check Dashboard** - Show client statistics
5. **Create a Program** - Demonstrate program builder

### For Clients:
1. **Login** with client account
2. **View Assigned Programs**
3. **Log a Workout**
4. **Track Progress**

## 📱 Key Pages to Showcase

| Page | URL | Purpose |
|------|-----|---------|
| **Exercises** | `/exercises` | 1,324 exercises library |
| **Programs** | `/programs` | Sample workout programs |
| **Trainer Dashboard** | `/dashboard/trainer` | Trainer overview |
| **Client Dashboard** | `/dashboard/client` | Client overview |
| **Workout Log** | `/workouts/log` | Log workouts |
| **Progress** | `/workouts/progress` | View progress charts |
| **History** | `/workouts/history` | Workout history |

## 🛠️ Troubleshooting

### Backend not responding?
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Restart backend
cd backend && npm run dev
```

### Frontend not loading?
```bash
# Clear Next.js cache
rm -rf .next

# Restart frontend
npm run dev
```

### Login not working?
- Ensure backend is running on port 5000
- Check `.env.local` has correct API URL:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:5000/api
  ```

## 📊 Database Statistics

| Entity | Count |
|--------|-------|
| **Exercises** | 1,324 |
| **Programs** | 3 |
| **Total Workouts** | 76 |
| **Test Users** | 2 |

## 🎉 Demo Success Checklist

- [x] Exercise library populated (1,324 exercises)
- [x] Sample programs created (3 programs)
- [x] Test accounts configured
- [x] Authentication working
- [x] Backend API running
- [x] Frontend serving pages
- [x] All core features accessible

---

**Demo Ready! 🚀**

EvoFit Trainer is now fully prepared for demos and trial users.
