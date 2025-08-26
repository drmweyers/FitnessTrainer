import { Response } from 'express';
import { profileService } from '@/services/profileService';
import { logger } from '@/config/logger';
import {
  createUserProfileSchema,
  updateUserProfileSchema,
  createUserMeasurementSchema,
  createUserHealthSchema,
  updateUserHealthSchema,
  createUserGoalSchema,
  updateUserGoalSchema,
  createTrainerCertificationSchema,
  updateTrainerCertificationSchema,
  createTrainerSpecializationSchema,
  updateTrainerSpecializationSchema,
  createProgressPhotoSchema,
  type UserProfileResponse,
  type UserMeasurementResponse,
  type UserMeasurementHistoryResponse,
  type UserHealthResponse,
  type UserGoalsResponse,
  type TrainerCertificationsResponse,
  type ProfileCompletionResponse,
} from '@/types/profile';
import type { Request } from 'express';

// Type for authenticated requests (user data is attached by middleware)
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: 'trainer' | 'client' | 'admin';
    isActive: boolean;
    isVerified: boolean;
  };
  tokenId?: string;
};

export class ProfileController {
  // ====================================
  // USER PROFILE METHODS
  // ====================================

  /**
   * Get current user's profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await profileService.getProfile(userId);

      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
        return;
      }

      const response: UserProfileResponse = {
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          profile: {
            id: profile.id,
            bio: profile.bio,
            dateOfBirth: profile.dateOfBirth?.toISOString() || null,
            gender: profile.gender,
            phone: profile.phone,
            timezone: profile.timezone,
            preferredUnits: profile.preferredUnits,
            profilePhotoUrl: profile.profilePhotoUrl,
            coverPhotoUrl: profile.coverPhotoUrl,
            isPublic: profile.isPublic,
            completedAt: profile.completedAt?.toISOString() || null,
            createdAt: profile.createdAt.toISOString(),
            updatedAt: profile.updatedAt?.toISOString() || null,
          },
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Create user profile
   */
  async createProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validation = createUserProfileSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid profile data',
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
        return;
      }

      const userId = req.user!.id;
      const profile = await profileService.createProfile(userId, validation.data);

      const response: UserProfileResponse = {
        success: true,
        message: 'Profile created successfully',
        data: {
          profile: {
            id: profile.id,
            bio: profile.bio,
            dateOfBirth: profile.dateOfBirth?.toISOString() || null,
            gender: profile.gender,
            phone: profile.phone,
            timezone: profile.timezone,
            preferredUnits: profile.preferredUnits,
            profilePhotoUrl: profile.profilePhotoUrl,
            coverPhotoUrl: profile.coverPhotoUrl,
            isPublic: profile.isPublic,
            completedAt: profile.completedAt?.toISOString() || null,
            createdAt: profile.createdAt.toISOString(),
            updatedAt: profile.updatedAt?.toISOString() || null,
          },
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to create user profile:', error);
      
      // Handle duplicate profile error
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(409).json({
          success: false,
          message: 'Profile already exists',
          error: 'PROFILE_EXISTS',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create profile',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validation = updateUserProfileSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid profile data',
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
        return;
      }

      const userId = req.user!.id;
      const profile = await profileService.updateProfile(userId, validation.data);

      const response: UserProfileResponse = {
        success: true,
        message: 'Profile updated successfully',
        data: {
          profile: {
            id: profile.id,
            bio: profile.bio,
            dateOfBirth: profile.dateOfBirth?.toISOString() || null,
            gender: profile.gender,
            phone: profile.phone,
            timezone: profile.timezone,
            preferredUnits: profile.preferredUnits,
            profilePhotoUrl: profile.profilePhotoUrl,
            coverPhotoUrl: profile.coverPhotoUrl,
            isPublic: profile.isPublic,
            completedAt: profile.completedAt?.toISOString() || null,
            createdAt: profile.createdAt.toISOString(),
            updatedAt: profile.updatedAt?.toISOString() || null,
          },
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update user profile:', error);
      
      // Handle profile not found
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        res.status(404).json({
          success: false,
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Update profile photo
   */
  async updateProfilePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { photoUrl } = req.body;

      if (!photoUrl || typeof photoUrl !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Photo URL is required',
          error: 'INVALID_INPUT',
        });
        return;
      }

      const userId = req.user!.id;
      const profile = await profileService.updateProfilePhoto(userId, photoUrl);

      const response: UserProfileResponse = {
        success: true,
        message: 'Profile photo updated successfully',
        data: {
          profile: {
            id: profile.id,
            bio: profile.bio,
            dateOfBirth: profile.dateOfBirth?.toISOString() || null,
            gender: profile.gender,
            phone: profile.phone,
            timezone: profile.timezone,
            preferredUnits: profile.preferredUnits,
            profilePhotoUrl: profile.profilePhotoUrl,
            coverPhotoUrl: profile.coverPhotoUrl,
            isPublic: profile.isPublic,
            completedAt: profile.completedAt?.toISOString() || null,
            createdAt: profile.createdAt.toISOString(),
            updatedAt: profile.updatedAt?.toISOString() || null,
          },
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update profile photo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile photo',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  // ====================================
  // USER MEASUREMENTS METHODS
  // ====================================

  /**
   * Add user measurement
   */
  async addMeasurement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validation = createUserMeasurementSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid measurement data',
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
        return;
      }

      const userId = req.user!.id;
      const measurement = await profileService.addMeasurement(userId, validation.data);

      const response: UserMeasurementResponse = {
        success: true,
        message: 'Measurement added successfully',
        data: {
          measurement: {
            id: measurement.id,
            height: measurement.height ? parseFloat(measurement.height.toString()) : null,
            weight: measurement.weight ? parseFloat(measurement.weight.toString()) : null,
            bodyFatPercentage: measurement.bodyFatPercentage ? parseFloat(measurement.bodyFatPercentage.toString()) : null,
            muscleMass: measurement.muscleMass ? parseFloat(measurement.muscleMass.toString()) : null,
            measurements: measurement.measurements as Record<string, number> | null,
            recordedAt: measurement.recordedAt.toISOString(),
          },
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to add user measurement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add measurement',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get measurement history
   */
  async getMeasurementHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.user!.id;
      
      const measurements = await profileService.getMeasurementHistory(userId, limit);

      const response: UserMeasurementHistoryResponse = {
        success: true,
        message: 'Measurement history retrieved successfully',
        data: {
          measurements: measurements.map(measurement => ({
            id: measurement.id,
            height: measurement.height ? parseFloat(measurement.height.toString()) : null,
            weight: measurement.weight ? parseFloat(measurement.weight.toString()) : null,
            bodyFatPercentage: measurement.bodyFatPercentage ? parseFloat(measurement.bodyFatPercentage.toString()) : null,
            muscleMass: measurement.muscleMass ? parseFloat(measurement.muscleMass.toString()) : null,
            measurements: measurement.measurements as Record<string, number> | null,
            recordedAt: measurement.recordedAt.toISOString(),
          })),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get measurement history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve measurement history',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get latest measurement
   */
  async getLatestMeasurement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const measurement = await profileService.getLatestMeasurement(userId);

      if (!measurement) {
        res.status(404).json({
          success: false,
          message: 'No measurements found',
          error: 'MEASUREMENTS_NOT_FOUND',
        });
        return;
      }

      const response: UserMeasurementResponse = {
        success: true,
        message: 'Latest measurement retrieved successfully',
        data: {
          measurement: {
            id: measurement.id,
            height: measurement.height ? parseFloat(measurement.height.toString()) : null,
            weight: measurement.weight ? parseFloat(measurement.weight.toString()) : null,
            bodyFatPercentage: measurement.bodyFatPercentage ? parseFloat(measurement.bodyFatPercentage.toString()) : null,
            muscleMass: measurement.muscleMass ? parseFloat(measurement.muscleMass.toString()) : null,
            measurements: measurement.measurements as Record<string, number> | null,
            recordedAt: measurement.recordedAt.toISOString(),
          },
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get latest measurement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve latest measurement',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  // ====================================
  // USER HEALTH METHODS
  // ====================================

  /**
   * Get user health information
   */
  async getHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const health = await profileService.getHealth(userId);

      if (!health) {
        res.status(404).json({
          success: false,
          message: 'Health information not found',
          error: 'HEALTH_NOT_FOUND',
        });
        return;
      }

      const response: UserHealthResponse = {
        success: true,
        message: 'Health information retrieved successfully',
        data: {
          health: {
            id: health.id,
            bloodType: health.bloodType,
            medicalConditions: health.medicalConditions,
            medications: health.medications,
            allergies: health.allergies,
            injuries: health.injuries as Record<string, any> | null,
            surgeries: health.surgeries as Record<string, any> | null,
            familyHistory: health.familyHistory as Record<string, any> | null,
            lifestyle: health.lifestyle as Record<string, any> | null,
            lastPhysicalExam: health.lastPhysicalExam?.toISOString() || null,
            emergencyContact: health.emergencyContact as Record<string, any> | null,
            createdAt: health.createdAt.toISOString(),
            updatedAt: health.updatedAt?.toISOString() || null,
          },
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get user health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve health information',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Create or update user health information
   */
  async upsertHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validation = createUserHealthSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid health data',
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
        return;
      }

      const userId = req.user!.id;
      const health = await profileService.upsertHealth(userId, validation.data);

      const response: UserHealthResponse = {
        success: true,
        message: 'Health information updated successfully',
        data: {
          health: {
            id: health.id,
            bloodType: health.bloodType,
            medicalConditions: health.medicalConditions,
            medications: health.medications,
            allergies: health.allergies,
            injuries: health.injuries as Record<string, any> | null,
            surgeries: health.surgeries as Record<string, any> | null,
            familyHistory: health.familyHistory as Record<string, any> | null,
            lifestyle: health.lifestyle as Record<string, any> | null,
            lastPhysicalExam: health.lastPhysicalExam?.toISOString() || null,
            emergencyContact: health.emergencyContact as Record<string, any> | null,
            createdAt: health.createdAt.toISOString(),
            updatedAt: health.updatedAt?.toISOString() || null,
          },
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to upsert user health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update health information',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  // ====================================
  // USER GOALS METHODS
  // ====================================

  /**
   * Get user goals
   */
  async getGoals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const userId = req.user!.id;
      
      const goals = await profileService.getGoals(userId, includeInactive);

      const response: UserGoalsResponse = {
        success: true,
        message: 'Goals retrieved successfully',
        data: {
          goals: goals.map(goal => ({
            id: goal.id,
            goalType: goal.goalType,
            specificGoal: goal.specificGoal,
            targetValue: goal.targetValue ? parseFloat(goal.targetValue.toString()) : null,
            targetDate: goal.targetDate?.toISOString() || null,
            priority: goal.priority,
            isActive: goal.isActive,
            achievedAt: goal.achievedAt?.toISOString() || null,
            createdAt: goal.createdAt.toISOString(),
          })),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get user goals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve goals',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Create user goal
   */
  async createGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validation = createUserGoalSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid goal data',
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
        return;
      }

      const userId = req.user!.id;
      const goal = await profileService.createGoal(userId, validation.data);

      res.status(201).json({
        success: true,
        message: 'Goal created successfully',
        data: {
          goal: {
            id: goal.id,
            goalType: goal.goalType,
            specificGoal: goal.specificGoal,
            targetValue: goal.targetValue ? parseFloat(goal.targetValue.toString()) : null,
            targetDate: goal.targetDate?.toISOString() || null,
            priority: goal.priority,
            isActive: goal.isActive,
            achievedAt: goal.achievedAt?.toISOString() || null,
            createdAt: goal.createdAt.toISOString(),
          },
        },
      });
    } catch (error) {
      logger.error('Failed to create user goal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create goal',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Update user goal
   */
  async updateGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { goalId } = req.params;
      
      if (!goalId) {
        res.status(400).json({
          success: false,
          message: 'Goal ID is required',
          error: 'MISSING_GOAL_ID',
        });
        return;
      }
      
      const validation = updateUserGoalSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid goal data',
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
        return;
      }

      const userId = req.user!.id;
      const goal = await profileService.updateGoal(goalId, userId, validation.data);

      res.json({
        success: true,
        message: 'Goal updated successfully',
        data: {
          goal: {
            id: goal.id,
            goalType: goal.goalType,
            specificGoal: goal.specificGoal,
            targetValue: goal.targetValue ? parseFloat(goal.targetValue.toString()) : null,
            targetDate: goal.targetDate?.toISOString() || null,
            priority: goal.priority,
            isActive: goal.isActive,
            achievedAt: goal.achievedAt?.toISOString() || null,
            createdAt: goal.createdAt.toISOString(),
          },
        },
      });
    } catch (error) {
      logger.error('Failed to update user goal:', error);
      
      // Handle goal not found or unauthorized
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        res.status(404).json({
          success: false,
          message: 'Goal not found or unauthorized',
          error: 'GOAL_NOT_FOUND',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update goal',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Mark goal as achieved
   */
  async achieveGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { goalId } = req.params;
      
      if (!goalId) {
        res.status(400).json({
          success: false,
          message: 'Goal ID is required',
          error: 'MISSING_GOAL_ID',
        });
        return;
      }
      
      const userId = req.user!.id;
      
      const goal = await profileService.achieveGoal(goalId, userId);

      res.json({
        success: true,
        message: 'Goal marked as achieved successfully',
        data: {
          goal: {
            id: goal.id,
            goalType: goal.goalType,
            specificGoal: goal.specificGoal,
            targetValue: goal.targetValue ? parseFloat(goal.targetValue.toString()) : null,
            targetDate: goal.targetDate?.toISOString() || null,
            priority: goal.priority,
            isActive: goal.isActive,
            achievedAt: goal.achievedAt?.toISOString() || null,
            createdAt: goal.createdAt.toISOString(),
          },
        },
      });
    } catch (error) {
      logger.error('Failed to achieve user goal:', error);
      
      // Handle goal not found or unauthorized
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        res.status(404).json({
          success: false,
          message: 'Goal not found or unauthorized',
          error: 'GOAL_NOT_FOUND',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to mark goal as achieved',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  // ====================================
  // TRAINER CERTIFICATION METHODS
  // ====================================

  /**
   * Get trainer certifications (trainers only)
   */
  async getCertifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check if user is a trainer
      if (req.user!.role !== 'trainer' && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Trainers only.',
          error: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      const trainerId = req.user!.id;
      const certifications = await profileService.getCertifications(trainerId);

      const response: TrainerCertificationsResponse = {
        success: true,
        message: 'Certifications retrieved successfully',
        data: {
          certifications: certifications.map(cert => ({
            id: cert.id,
            certificationName: cert.certificationName,
            issuingOrganization: cert.issuingOrganization,
            credentialId: cert.credentialId,
            issueDate: cert.issueDate?.toISOString() || null,
            expiryDate: cert.expiryDate?.toISOString() || null,
            documentUrl: cert.documentUrl,
            isVerified: cert.isVerified,
            verifiedAt: cert.verifiedAt?.toISOString() || null,
            createdAt: cert.createdAt.toISOString(),
          })),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get trainer certifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve certifications',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Create trainer certification (trainers only)
   */
  async createCertification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check if user is a trainer
      if (req.user!.role !== 'trainer' && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Trainers only.',
          error: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      const validation = createTrainerCertificationSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid certification data',
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
        return;
      }

      const trainerId = req.user!.id;
      const certification = await profileService.createCertification(trainerId, validation.data);

      res.status(201).json({
        success: true,
        message: 'Certification created successfully',
        data: {
          certification: {
            id: certification.id,
            certificationName: certification.certificationName,
            issuingOrganization: certification.issuingOrganization,
            credentialId: certification.credentialId,
            issueDate: certification.issueDate?.toISOString() || null,
            expiryDate: certification.expiryDate?.toISOString() || null,
            documentUrl: certification.documentUrl,
            isVerified: certification.isVerified,
            verifiedAt: certification.verifiedAt?.toISOString() || null,
            createdAt: certification.createdAt.toISOString(),
          },
        },
      });
    } catch (error) {
      logger.error('Failed to create trainer certification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create certification',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Update trainer certification (trainers only)
   */
  async updateCertification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check if user is a trainer
      if (req.user!.role !== 'trainer' && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Trainers only.',
          error: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      const { certificationId } = req.params;
      
      if (!certificationId) {
        res.status(400).json({
          success: false,
          message: 'Certification ID is required',
          error: 'MISSING_CERTIFICATION_ID',
        });
        return;
      }
      
      const validation = updateTrainerCertificationSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid certification data',
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
        return;
      }

      const trainerId = req.user!.id;
      const certification = await profileService.updateCertification(certificationId, trainerId, validation.data);

      res.json({
        success: true,
        message: 'Certification updated successfully',
        data: {
          certification: {
            id: certification.id,
            certificationName: certification.certificationName,
            issuingOrganization: certification.issuingOrganization,
            credentialId: certification.credentialId,
            issueDate: certification.issueDate?.toISOString() || null,
            expiryDate: certification.expiryDate?.toISOString() || null,
            documentUrl: certification.documentUrl,
            isVerified: certification.isVerified,
            verifiedAt: certification.verifiedAt?.toISOString() || null,
            createdAt: certification.createdAt.toISOString(),
          },
        },
      });
    } catch (error) {
      logger.error('Failed to update trainer certification:', error);
      
      // Handle certification not found or unauthorized
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        res.status(404).json({
          success: false,
          message: 'Certification not found or unauthorized',
          error: 'CERTIFICATION_NOT_FOUND',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update certification',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get trainer specializations (trainers only)
   */
  async getSpecializations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check if user is a trainer
      if (req.user!.role !== 'trainer' && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Trainers only.',
          error: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      const trainerId = req.user!.id;
      const specializations = await profileService.getSpecializations(trainerId);

      res.json({
        success: true,
        message: 'Specializations retrieved successfully',
        data: {
          specializations: specializations.map(spec => ({
            id: spec.id,
            specialization: spec.specialization,
            yearsExperience: spec.yearsExperience,
            description: spec.description,
          })),
        },
      });
    } catch (error) {
      logger.error('Failed to get trainer specializations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve specializations',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Create trainer specialization (trainers only)
   */
  async createSpecialization(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check if user is a trainer
      if (req.user!.role !== 'trainer' && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Trainers only.',
          error: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      const validation = createTrainerSpecializationSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid specialization data',
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
        return;
      }

      const trainerId = req.user!.id;
      const specialization = await profileService.createSpecialization(trainerId, validation.data);

      res.status(201).json({
        success: true,
        message: 'Specialization created successfully',
        data: {
          specialization: {
            id: specialization.id,
            specialization: specialization.specialization,
            yearsExperience: specialization.yearsExperience,
            description: specialization.description,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to create trainer specialization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create specialization',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  // ====================================
  // PROGRESS PHOTOS METHODS
  // ====================================

  /**
   * Add progress photo
   */
  async addProgressPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { photoUrl, thumbnailUrl, ...photoData } = req.body;
      
      if (!photoUrl || typeof photoUrl !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Photo URL is required',
          error: 'INVALID_INPUT',
        });
        return;
      }

      const validation = createProgressPhotoSchema.safeParse(photoData);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid progress photo data',
          error: 'VALIDATION_ERROR',
          details: validation.error.errors,
        });
        return;
      }

      const userId = req.user!.id;
      const photo = await profileService.addProgressPhoto(userId, photoUrl, thumbnailUrl || null, validation.data);

      res.status(201).json({
        success: true,
        message: 'Progress photo added successfully',
        data: {
          photo: {
            id: photo.id,
            photoUrl: photo.photoUrl,
            thumbnailUrl: photo.thumbnailUrl,
            photoType: photo.photoType,
            notes: photo.notes,
            isPrivate: photo.isPrivate,
            takenAt: photo.takenAt?.toISOString() || null,
            uploadedAt: photo.uploadedAt.toISOString(),
          },
        },
      });
    } catch (error) {
      logger.error('Failed to add progress photo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add progress photo',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get progress photos
   */
  async getProgressPhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const includePrivate = req.query.includePrivate !== 'false'; // Default to true
      const userId = req.user!.id;
      
      const photos = await profileService.getProgressPhotos(userId, includePrivate);

      res.json({
        success: true,
        message: 'Progress photos retrieved successfully',
        data: {
          photos: photos.map(photo => ({
            id: photo.id,
            photoUrl: photo.photoUrl,
            thumbnailUrl: photo.thumbnailUrl,
            photoType: photo.photoType,
            notes: photo.notes,
            isPrivate: photo.isPrivate,
            takenAt: photo.takenAt?.toISOString() || null,
            uploadedAt: photo.uploadedAt.toISOString(),
          })),
        },
      });
    } catch (error) {
      logger.error('Failed to get progress photos:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve progress photos',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Delete progress photo
   */
  async deleteProgressPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { photoId } = req.params;
      
      if (!photoId) {
        res.status(400).json({
          success: false,
          message: 'Photo ID is required',
          error: 'MISSING_PHOTO_ID',
        });
        return;
      }
      
      const userId = req.user!.id;
      
      const photo = await profileService.deleteProgressPhoto(photoId, userId);

      res.json({
        success: true,
        message: 'Progress photo deleted successfully',
        data: {
          deletedPhoto: {
            id: photo.id,
            photoUrl: photo.photoUrl,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to delete progress photo:', error);
      
      // Handle photo not found or unauthorized
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        res.status(404).json({
          success: false,
          message: 'Progress photo not found or unauthorized',
          error: 'PHOTO_NOT_FOUND',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete progress photo',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  // ====================================
  // PROFILE COMPLETION METHODS
  // ====================================

  /**
   * Get profile completion status
   */
  async getProfileCompletion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const completion = await profileService.getProfileCompletion(userId);

      const response: ProfileCompletionResponse = {
        success: true,
        message: 'Profile completion retrieved successfully',
        data: {
          completion: {
            id: completion.id,
            basicInfo: completion.basicInfo,
            profilePhoto: completion.profilePhoto,
            healthInfo: completion.healthInfo,
            goalsSet: completion.goalsSet,
            measurements: completion.measurements,
            certifications: completion.certifications,
            completionPercentage: completion.completionPercentage,
            lastUpdated: completion.lastUpdated.toISOString(),
          },
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get profile completion:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile completion',
        error: 'INTERNAL_ERROR',
      });
    }
  }
}

export const profileController = new ProfileController();