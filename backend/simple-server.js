const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = 4000; // Fixed port for Docker

// Initialize Prisma
const prisma = new PrismaClient({
  log: ['error'],
});

// Basic middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'EvoFit API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Get exercises with search and filters
app.get('/api/exercises', async (req, res) => {
  try {
    const {
      search,
      bodyPart,
      equipment,
      targetMuscle,
      difficulty,
      limit = '20',
      offset = '0',
    } = req.query;

    const where = {
      isActive: true,
    };

    // Add search filter
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { bodyPart: { contains: search.trim(), mode: 'insensitive' } },
        { targetMuscle: { contains: search.trim(), mode: 'insensitive' } },
        { equipment: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Add filters
    if (bodyPart && bodyPart !== 'all') {
      where.bodyPart = { equals: bodyPart, mode: 'insensitive' };
    }
    if (equipment && equipment !== 'all') {
      where.equipment = { equals: equipment, mode: 'insensitive' };
    }
    if (targetMuscle && targetMuscle !== 'all') {
      where.targetMuscle = { equals: targetMuscle, mode: 'insensitive' };
    }
    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty;
    }

    // Get exercises with pagination
    const [exercises, totalCount] = await Promise.all([
      prisma.exercise.findMany({
        where,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.exercise.count({ where }),
    ]);

    // Format response
    const formattedExercises = exercises.map(exercise => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      gifUrl: exercise.gifUrl,
      bodyPart: exercise.bodyPart,
      equipment: exercise.equipment,
      targetMuscle: exercise.targetMuscle,
      secondaryMuscles: exercise.secondaryMuscles,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      isFavorite: false, // Would need auth for real favorites
      isActive: exercise.isActive,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
    }));

    res.json({
      success: true,
      data: {
        exercises: formattedExercises,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < totalCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exercises',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Get exercise categories (must come before :id route)
app.get('/api/exercises/categories', async (req, res) => {
  try {
    const { type } = req.query;

    const categories = {
      bodyParts: [],
      equipment: [],
      targetMuscles: [],
      difficulties: ['beginner', 'intermediate', 'advanced'],
    };

    if (!type || type === 'bodyParts') {
      const bodyParts = await prisma.exercise.findMany({
        where: { isActive: true },
        select: { bodyPart: true },
        distinct: ['bodyPart'],
        orderBy: { bodyPart: 'asc' },
      });
      categories.bodyParts = bodyParts.map(bp => bp.bodyPart);
    }

    if (!type || type === 'equipment') {
      const equipment = await prisma.exercise.findMany({
        where: { isActive: true },
        select: { equipment: true },
        distinct: ['equipment'],
        orderBy: { equipment: 'asc' },
      });
      categories.equipment = equipment.map(eq => eq.equipment);
    }

    if (!type || type === 'targetMuscles') {
      const targetMuscles = await prisma.exercise.findMany({
        where: { isActive: true },
        select: { targetMuscle: true },
        distinct: ['targetMuscle'],
        orderBy: { targetMuscle: 'asc' },
      });
      categories.targetMuscles = targetMuscles.map(tm => tm.targetMuscle);
    }

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exercise categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Get single exercise by ID
app.get('/api/exercises/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Exercise ID is required',
      });
    }

    // Check if the id is a UUID or exercise ID
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    
    const exercise = await prisma.exercise.findFirst({
      where: {
        ...(isUUID 
          ? { OR: [{ id }, { exerciseId: id }] }
          : { exerciseId: id }
        ),
        isActive: true,
      },
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found',
      });
    }

    const formattedExercise = {
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      gifUrl: exercise.gifUrl,
      bodyPart: exercise.bodyPart,
      equipment: exercise.equipment,
      targetMuscle: exercise.targetMuscle,
      secondaryMuscles: exercise.secondaryMuscles,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      isFavorite: false, // Would need auth for real favorites
      isActive: exercise.isActive,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
    };

    res.json({
      success: true,
      data: formattedExercise,
    });
  } catch (error) {
    console.error('Error getting exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exercise',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});


// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: {
      code: 'ROUTE_NOT_FOUND',
      path: req.originalUrl,
      method: req.method,
    },
  });
});

async function startServer() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database');

    // Check exercise count
    const exerciseCount = await prisma.exercise.count();
    console.log(`📊 Loaded ${exerciseCount} exercises`);

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 EvoFit Backend API running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  try {
    await prisma.$disconnect();
    console.log('✅ Connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();