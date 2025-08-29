import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Body Measurements Routes
router.get('/measurements/:userId', 
  authorize('trainer', 'client'), 
  AnalyticsController.getBodyMeasurements
);

router.post('/measurements', 
  authorize('client'), 
  AnalyticsController.saveBodyMeasurement
);

router.put('/measurements/:id', 
  authorize('client'), 
  AnalyticsController.updateBodyMeasurement
);

router.delete('/measurements/:id', 
  authorize('client'), 
  AnalyticsController.deleteBodyMeasurement
);

// Performance Metrics Routes
router.get('/performance', 
  authorize('trainer', 'client'), 
  AnalyticsController.getPerformanceMetrics
);

router.post('/performance', 
  authorize('client'), 
  AnalyticsController.recordPerformanceMetric
);

router.get('/performance/:userId/personal-bests', 
  authorize('trainer', 'client'), 
  AnalyticsController.getPersonalBests
);

// Training Load Routes
router.get('/training-load/:userId', 
  authorize('trainer', 'client'), 
  AnalyticsController.getTrainingLoad
);

router.post('/training-load/calculate', 
  authorize('trainer', 'client'), 
  AnalyticsController.calculateWeeklyLoad
);

// Goal Progress Routes
router.get('/goals/:goalId/progress', 
  authorize('trainer', 'client'), 
  AnalyticsController.getGoalProgress
);

router.post('/goals/:goalId/progress', 
  authorize('client'), 
  AnalyticsController.updateGoalProgress
);

// User Insights Routes
router.get('/insights/:userId', 
  authorize('trainer', 'client'), 
  AnalyticsController.getUserInsights
);

router.put('/insights/:insightId/read', 
  authorize('client'), 
  AnalyticsController.markInsightAsRead
);

router.put('/insights/:insightId/action-taken', 
  authorize('client'), 
  AnalyticsController.markInsightActionTaken
);

// Milestone Achievements Routes
router.get('/milestones/:userId', 
  authorize('trainer', 'client'), 
  AnalyticsController.getMilestoneAchievements
);

// Dashboard Routes
router.get('/dashboard/:userId', 
  authorize('trainer', 'client'), 
  AnalyticsController.getDashboardData
);

export default router;