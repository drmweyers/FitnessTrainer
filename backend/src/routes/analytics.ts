import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Body Measurements Routes
// Route for accessing own measurements
router.get('/measurements/me', 
  authorize('trainer', 'client'), 
  (req, res, next) => {
    req.params.userId = req.user!.id;
    AnalyticsController.getBodyMeasurements(req, res, next);
  }
);

// Route for trainers to access specific client measurements
router.get('/measurements/:userId', 
  authorize('trainer', 'admin'), 
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
router.get('/performance/me', 
  authorize('trainer', 'client'), 
  (req, res, next) => {
    req.query.userId = req.user!.id;
    AnalyticsController.getPerformanceMetrics(req, res, next);
  }
);

router.get('/performance', 
  authorize('trainer', 'admin'), 
  AnalyticsController.getPerformanceMetrics
);

router.post('/performance', 
  authorize('client'), 
  AnalyticsController.recordPerformanceMetric
);

router.get('/performance/me/personal-bests', 
  authorize('trainer', 'client'), 
  (req, res, next) => {
    req.params.userId = req.user!.id;
    AnalyticsController.getPersonalBests(req, res, next);
  }
);

router.get('/performance/:userId/personal-bests', 
  authorize('trainer', 'admin'), 
  AnalyticsController.getPersonalBests
);

// Training Load Routes
router.get('/training-load/me', 
  authorize('trainer', 'client'), 
  (req, res, next) => {
    req.params.userId = req.user!.id;
    AnalyticsController.getTrainingLoad(req, res, next);
  }
);

router.get('/training-load/:userId', 
  authorize('trainer', 'admin'), 
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
router.get('/insights/me', 
  authorize('trainer', 'client'), 
  (req, res, next) => {
    req.params.userId = req.user!.id;
    AnalyticsController.getUserInsights(req, res, next);
  }
);

router.get('/insights/:userId', 
  authorize('trainer', 'admin'), 
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
router.get('/milestones/me', 
  authorize('trainer', 'client'), 
  (req, res, next) => {
    req.params.userId = req.user!.id;
    AnalyticsController.getMilestoneAchievements(req, res, next);
  }
);

router.get('/milestones/:userId', 
  authorize('trainer', 'admin'), 
  AnalyticsController.getMilestoneAchievements
);

// Dashboard Routes
router.get('/dashboard/me', 
  authorize('trainer', 'client'), 
  (req, res, next) => {
    req.params.userId = req.user!.id;
    AnalyticsController.getDashboardData(req, res, next);
  }
);

router.get('/dashboard/:userId', 
  authorize('trainer', 'admin'), 
  AnalyticsController.getDashboardData
);

export default router;