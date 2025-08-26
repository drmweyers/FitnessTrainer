import { prisma } from '../index';
import { logger } from '@/config/logger';
import type {
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
  CreateUserMeasurementRequest,
  CreateUserHealthRequest,
  UpdateUserHealthRequest,
  CreateUserGoalRequest,
  UpdateUserGoalRequest,
  CreateTrainerCertificationRequest,
  UpdateTrainerCertificationRequest,
  CreateTrainerSpecializationRequest,
  UpdateTrainerSpecializationRequest,
} from '@/types/profile';

class ProfileService {
  // ====================================
  // USER PROFILE METHODS
  // ====================================

  /**
   * Get user profile by user ID
   */
  async getProfile(userId: string) {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
      });

      return profile;
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Create user profile
   */
  async createProfile(userId: string, data: CreateUserProfileRequest) {
    try {
      const profile = await prisma.userProfile.create({
        data: {
          userId,
          ...data,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        },
      });

      // Update profile completion
      await this.updateProfileCompletion(userId, { basicInfo: true });

      logger.info('User profile created:', { userId, profileId: profile.id });
      return profile;
    } catch (error) {
      logger.error('Failed to create user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateUserProfileRequest) {
    try {
      const profile = await prisma.userProfile.update({
        where: { userId },
        data: {
          ...data,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        },
      });

      // Update profile completion
      await this.updateProfileCompletion(userId, { basicInfo: true });

      logger.info('User profile updated:', { userId, profileId: profile.id });
      return profile;
    } catch (error) {
      logger.error('Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Update profile photo URL
   */
  async updateProfilePhoto(userId: string, photoUrl: string) {
    try {
      const profile = await prisma.userProfile.upsert({
        where: { userId },
        update: { profilePhotoUrl: photoUrl },
        create: {
          userId,
          profilePhotoUrl: photoUrl,
        },
      });

      // Update profile completion
      await this.updateProfileCompletion(userId, { profilePhoto: true });

      logger.info('Profile photo updated:', { userId, photoUrl });
      return profile;
    } catch (error) {
      logger.error('Failed to update profile photo:', error);
      throw error;
    }
  }

  // ====================================
  // USER MEASUREMENTS METHODS
  // ====================================

  /**
   * Add user measurement
   */
  async addMeasurement(userId: string, data: CreateUserMeasurementRequest) {
    try {
      const measurement = await prisma.userMeasurement.create({
        data: {
          userId,
          ...data,
        },
      });

      // Update profile completion
      await this.updateProfileCompletion(userId, { measurements: true });

      logger.info('User measurement added:', { userId, measurementId: measurement.id });
      return measurement;
    } catch (error) {
      logger.error('Failed to add user measurement:', error);
      throw error;
    }
  }

  /**
   * Get user measurement history
   */
  async getMeasurementHistory(userId: string, limit: number = 10) {
    try {
      const measurements = await prisma.userMeasurement.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: limit,
      });

      return measurements;
    } catch (error) {
      logger.error('Failed to get measurement history:', error);
      throw error;
    }
  }

  /**
   * Get latest measurement
   */
  async getLatestMeasurement(userId: string) {
    try {
      const measurement = await prisma.userMeasurement.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
      });

      return measurement;
    } catch (error) {
      logger.error('Failed to get latest measurement:', error);
      throw error;
    }
  }

  // ====================================
  // USER HEALTH METHODS
  // ====================================

  /**
   * Get user health information
   */
  async getHealth(userId: string) {
    try {
      const health = await prisma.userHealth.findUnique({
        where: { userId },
      });

      return health;
    } catch (error) {
      logger.error('Failed to get user health:', error);
      throw error;
    }
  }

  /**
   * Create or update user health information
   */
  async upsertHealth(userId: string, data: CreateUserHealthRequest | UpdateUserHealthRequest) {
    try {
      const health = await prisma.userHealth.upsert({
        where: { userId },
        update: {
          ...data,
          lastPhysicalExam: data.lastPhysicalExam ? new Date(data.lastPhysicalExam) : undefined,
        },
        create: {
          userId,
          ...data,
          lastPhysicalExam: data.lastPhysicalExam ? new Date(data.lastPhysicalExam) : null,
        },
      });

      // Update profile completion
      await this.updateProfileCompletion(userId, { healthInfo: true });

      logger.info('User health updated:', { userId, healthId: health.id });
      return health;
    } catch (error) {
      logger.error('Failed to update user health:', error);
      throw error;
    }
  }

  // ====================================
  // USER GOALS METHODS
  // ====================================

  /**
   * Get user goals
   */
  async getGoals(userId: string, includeInactive: boolean = false) {
    try {
      const goals = await prisma.userGoal.findMany({
        where: {
          userId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      return goals;
    } catch (error) {
      logger.error('Failed to get user goals:', error);
      throw error;
    }
  }

  /**
   * Create user goal
   */
  async createGoal(userId: string, data: CreateUserGoalRequest) {
    try {
      const goal = await prisma.userGoal.create({
        data: {
          userId,
          ...data,
          targetDate: data.targetDate ? new Date(data.targetDate) : null,
        },
      });

      // Update profile completion
      await this.updateProfileCompletion(userId, { goalsSet: true });

      logger.info('User goal created:', { userId, goalId: goal.id });
      return goal;
    } catch (error) {
      logger.error('Failed to create user goal:', error);
      throw error;
    }
  }

  /**
   * Update user goal
   */
  async updateGoal(goalId: string, userId: string, data: UpdateUserGoalRequest) {
    try {
      const goal = await prisma.userGoal.update({
        where: { 
          id: goalId,
          userId, // Ensure user owns the goal
        },
        data: {
          ...data,
          targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        },
      });

      logger.info('User goal updated:', { userId, goalId });
      return goal;
    } catch (error) {
      logger.error('Failed to update user goal:', error);
      throw error;
    }
  }

  /**
   * Mark goal as achieved
   */
  async achieveGoal(goalId: string, userId: string) {
    try {
      const goal = await prisma.userGoal.update({
        where: {
          id: goalId,
          userId,
        },
        data: {
          achievedAt: new Date(),
          isActive: false,
        },
      });

      logger.info('User goal achieved:', { userId, goalId });
      return goal;
    } catch (error) {
      logger.error('Failed to achieve user goal:', error);
      throw error;
    }
  }

  // ====================================
  // TRAINER CERTIFICATION METHODS
  // ====================================

  /**
   * Get trainer certifications
   */
  async getCertifications(trainerId: string) {
    try {
      const certifications = await prisma.trainerCertification.findMany({
        where: { trainerId },
        orderBy: { createdAt: 'desc' },
      });

      return certifications;
    } catch (error) {
      logger.error('Failed to get trainer certifications:', error);
      throw error;
    }
  }

  /**
   * Create trainer certification
   */
  async createCertification(trainerId: string, data: CreateTrainerCertificationRequest) {
    try {
      const certification = await prisma.trainerCertification.create({
        data: {
          trainerId,
          ...data,
          issueDate: data.issueDate ? new Date(data.issueDate) : null,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        },
      });

      // Update profile completion
      await this.updateProfileCompletion(trainerId, { certifications: true });

      logger.info('Trainer certification created:', { trainerId, certificationId: certification.id });
      return certification;
    } catch (error) {
      logger.error('Failed to create trainer certification:', error);
      throw error;
    }
  }

  /**
   * Update trainer certification
   */
  async updateCertification(certificationId: string, trainerId: string, data: UpdateTrainerCertificationRequest) {
    try {
      const certification = await prisma.trainerCertification.update({
        where: {
          id: certificationId,
          trainerId,
        },
        data: {
          ...data,
          issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        },
      });

      logger.info('Trainer certification updated:', { trainerId, certificationId });
      return certification;
    } catch (error) {
      logger.error('Failed to update trainer certification:', error);
      throw error;
    }
  }

  // ====================================
  // TRAINER SPECIALIZATION METHODS
  // ====================================

  /**
   * Get trainer specializations
   */
  async getSpecializations(trainerId: string) {
    try {
      const specializations = await prisma.trainerSpecialization.findMany({
        where: { trainerId },
      });

      return specializations;
    } catch (error) {
      logger.error('Failed to get trainer specializations:', error);
      throw error;
    }
  }

  /**
   * Create trainer specialization
   */
  async createSpecialization(trainerId: string, data: CreateTrainerSpecializationRequest) {
    try {
      const specialization = await prisma.trainerSpecialization.create({
        data: {
          trainerId,
          ...data,
        },
      });

      logger.info('Trainer specialization created:', { trainerId, specializationId: specialization.id });
      return specialization;
    } catch (error) {
      logger.error('Failed to create trainer specialization:', error);
      throw error;
    }
  }

  // ====================================
  // PROGRESS PHOTOS METHODS
  // ====================================

  /**
   * Add progress photo
   */
  async addProgressPhoto(userId: string, photoUrl: string, thumbnailUrl: string | null, data: { photoType: 'front' | 'side' | 'back' | 'other'; notes?: string; isPrivate?: boolean; takenAt?: string }) {
    try {
      const photo = await prisma.progressPhoto.create({
        data: {
          userId,
          photoUrl,
          thumbnailUrl,
          ...data,
          takenAt: data.takenAt ? new Date(data.takenAt) : new Date(),
        },
      });

      logger.info('Progress photo added:', { userId, photoId: photo.id });
      return photo;
    } catch (error) {
      logger.error('Failed to add progress photo:', error);
      throw error;
    }
  }

  /**
   * Get progress photos
   */
  async getProgressPhotos(userId: string, includePrivate: boolean = true) {
    try {
      const photos = await prisma.progressPhoto.findMany({
        where: {
          userId,
          ...(includePrivate ? {} : { isPrivate: false }),
        },
        orderBy: { takenAt: 'desc' },
      });

      return photos;
    } catch (error) {
      logger.error('Failed to get progress photos:', error);
      throw error;
    }
  }

  /**
   * Delete progress photo
   */
  async deleteProgressPhoto(photoId: string, userId: string) {
    try {
      const photo = await prisma.progressPhoto.delete({
        where: {
          id: photoId,
          userId,
        },
      });

      logger.info('Progress photo deleted:', { userId, photoId });
      return photo;
    } catch (error) {
      logger.error('Failed to delete progress photo:', error);
      throw error;
    }
  }

  // ====================================
  // PROFILE COMPLETION METHODS
  // ====================================

  /**
   * Get profile completion status
   */
  async getProfileCompletion(userId: string) {
    try {
      const completion = await prisma.profileCompletion.findUnique({
        where: { userId },
      });

      if (!completion) {
        // Create initial completion record
        return await prisma.profileCompletion.create({
          data: { userId },
        });
      }

      return completion;
    } catch (error) {
      logger.error('Failed to get profile completion:', error);
      throw error;
    }
  }

  /**
   * Update profile completion status
   */
  async updateProfileCompletion(userId: string, updates: Partial<{
    basicInfo: boolean;
    profilePhoto: boolean;
    healthInfo: boolean;
    goalsSet: boolean;
    measurements: boolean;
    certifications: boolean;
  }>) {
    try {
      // Get current completion status
      const current = await this.getProfileCompletion(userId);

      // Calculate new completion percentage
      const fields = {
        basicInfo: updates.basicInfo ?? current.basicInfo,
        profilePhoto: updates.profilePhoto ?? current.profilePhoto,
        healthInfo: updates.healthInfo ?? current.healthInfo,
        goalsSet: updates.goalsSet ?? current.goalsSet,
        measurements: updates.measurements ?? current.measurements,
        certifications: updates.certifications ?? current.certifications,
      };

      const completedFields = Object.values(fields).filter(Boolean).length;
      const totalFields = Object.keys(fields).length;
      const completionPercentage = Math.round((completedFields / totalFields) * 100);

      const completion = await prisma.profileCompletion.update({
        where: { userId },
        data: {
          ...updates,
          completionPercentage,
          lastUpdated: new Date(),
        },
      });

      logger.info('Profile completion updated:', { 
        userId, 
        completionPercentage, 
        updates 
      });

      return completion;
    } catch (error) {
      logger.error('Failed to update profile completion:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();