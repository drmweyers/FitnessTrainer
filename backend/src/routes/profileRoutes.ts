import { Router } from 'express';
import { profileController } from '@/controllers/profileController';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

// ====================================
// USER PROFILE ROUTES
// ====================================

// GET /api/profile - Get current user's profile
router.get('/', profileController.getProfile.bind(profileController));

// POST /api/profile - Create user profile
router.post('/', profileController.createProfile.bind(profileController));

// PUT /api/profile - Update user profile
router.put('/', profileController.updateProfile.bind(profileController));

// POST /api/profile/photo - Update profile photo
router.post('/photo', profileController.updateProfilePhoto.bind(profileController));

// ====================================
// USER MEASUREMENTS ROUTES
// ====================================

// POST /api/profile/measurements - Add user measurement
router.post('/measurements', profileController.addMeasurement.bind(profileController));

// GET /api/profile/measurements - Get measurement history
router.get('/measurements', profileController.getMeasurementHistory.bind(profileController));

// GET /api/profile/measurements/latest - Get latest measurement
router.get('/measurements/latest', profileController.getLatestMeasurement.bind(profileController));

// ====================================
// USER HEALTH ROUTES
// ====================================

// GET /api/profile/health - Get user health information
router.get('/health', profileController.getHealth.bind(profileController));

// PUT /api/profile/health - Create or update user health information
router.put('/health', profileController.upsertHealth.bind(profileController));

// ====================================
// USER GOALS ROUTES
// ====================================

// GET /api/profile/goals - Get user goals
router.get('/goals', profileController.getGoals.bind(profileController));

// POST /api/profile/goals - Create user goal
router.post('/goals', profileController.createGoal.bind(profileController));

// PUT /api/profile/goals/:goalId - Update user goal
router.put('/goals/:goalId', profileController.updateGoal.bind(profileController));

// POST /api/profile/goals/:goalId/achieve - Mark goal as achieved
router.post('/goals/:goalId/achieve', profileController.achieveGoal.bind(profileController));

// ====================================
// TRAINER CERTIFICATION ROUTES (Trainers only)
// ====================================

// GET /api/profile/certifications - Get trainer certifications
router.get('/certifications', profileController.getCertifications.bind(profileController));

// POST /api/profile/certifications - Create trainer certification
router.post('/certifications', profileController.createCertification.bind(profileController));

// PUT /api/profile/certifications/:certificationId - Update trainer certification
router.put('/certifications/:certificationId', profileController.updateCertification.bind(profileController));

// ====================================
// TRAINER SPECIALIZATION ROUTES (Trainers only)
// ====================================

// GET /api/profile/specializations - Get trainer specializations
router.get('/specializations', profileController.getSpecializations.bind(profileController));

// POST /api/profile/specializations - Create trainer specialization
router.post('/specializations', profileController.createSpecialization.bind(profileController));

// ====================================
// PROGRESS PHOTOS ROUTES
// ====================================

// POST /api/profile/progress-photos - Add progress photo
router.post('/progress-photos', profileController.addProgressPhoto.bind(profileController));

// GET /api/profile/progress-photos - Get progress photos
router.get('/progress-photos', profileController.getProgressPhotos.bind(profileController));

// DELETE /api/profile/progress-photos/:photoId - Delete progress photo
router.delete('/progress-photos/:photoId', profileController.deleteProgressPhoto.bind(profileController));

// ====================================
// PROFILE COMPLETION ROUTES
// ====================================

// GET /api/profile/completion - Get profile completion status
router.get('/completion', profileController.getProfileCompletion.bind(profileController));

export default router;