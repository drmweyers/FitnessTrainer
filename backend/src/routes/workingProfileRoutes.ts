import { Router, Request, Response } from 'express';
import { profileService } from '@/services/profileService';
import { authenticate } from '@/middleware/auth';
import { logger } from '@/config/logger';
import {
  createUserProfileSchema,
  updateUserProfileSchema,
  type UserProfileResponse,
} from '@/types/profile';

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

const router = Router();

// All profile routes require authentication
router.use(authenticate);

// ====================================
// USER PROFILE ROUTES
// ====================================

/**
 * Get current user's profile
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await profileService.getProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        error: 'PROFILE_NOT_FOUND',
      });
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
});

/**
 * Create user profile
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = createUserProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile data',
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
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
      return res.status(409).json({
        success: false,
        message: 'Profile already exists',
        error: 'PROFILE_EXISTS',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create profile',
      error: 'INTERNAL_ERROR',
    });
  }
});

/**
 * Update user profile
 */
router.put('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = updateUserProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile data',
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
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
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        error: 'PROFILE_NOT_FOUND',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: 'INTERNAL_ERROR',
    });
  }
});

export default router;