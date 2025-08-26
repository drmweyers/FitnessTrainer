import { Router } from 'express';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

// Simple test endpoint
router.get('/', async (req, res) => {
  try {
    // Test endpoint without controller
    res.json({
      success: true,
      message: 'Profile routes are working',
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in profile routes',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;