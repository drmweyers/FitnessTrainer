import { z } from 'zod';

// Enum schemas matching Prisma
export const preferredUnitsSchema = z.enum(['metric', 'imperial']);
export const goalTypeSchema = z.enum([
  'weight_loss',
  'muscle_gain', 
  'endurance',
  'strength',
  'flexibility',
  'general_fitness',
  'sport_specific',
  'rehabilitation'
]);
export const photoTypeSchema = z.enum(['front', 'side', 'back', 'other']);

// User Profile schemas
export const createUserProfileSchema = z.object({
  bio: z.string().max(2000, 'Bio must be less than 2000 characters').optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  timezone: z.string().max(50).optional(),
  preferredUnits: preferredUnitsSchema.optional(),
  isPublic: z.boolean().optional(),
});

export const updateUserProfileSchema = createUserProfileSchema.partial();

// User measurements schemas
export const createUserMeasurementSchema = z.object({
  height: z.number().min(50).max(300).optional(), // cm or inches
  weight: z.number().min(20).max(1000).optional(), // kg or lbs
  bodyFatPercentage: z.number().min(0).max(100).optional(),
  muscleMass: z.number().min(0).max(200).optional(),
  measurements: z.record(z.string(), z.number()).optional(), // chest, waist, hips, etc.
});

// User health schemas
export const createUserHealthSchema = z.object({
  bloodType: z.string().max(10).optional(),
  medicalConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  injuries: z.record(z.any()).optional(),
  surgeries: z.record(z.any()).optional(),
  familyHistory: z.record(z.any()).optional(),
  lifestyle: z.record(z.any()).optional(),
  lastPhysicalExam: z.string().datetime().optional(),
  emergencyContact: z.object({
    name: z.string().min(1),
    relationship: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional(),
  }).optional(),
});

export const updateUserHealthSchema = createUserHealthSchema.partial();

// User goals schemas
export const createUserGoalSchema = z.object({
  goalType: goalTypeSchema,
  specificGoal: z.string().max(1000).optional(),
  targetValue: z.number().optional(),
  targetDate: z.string().datetime().optional(),
  priority: z.number().min(1).max(10).optional(),
});

export const updateUserGoalSchema = createUserGoalSchema.partial();

// Trainer certification schemas
export const createTrainerCertificationSchema = z.object({
  certificationName: z.string().min(1).max(255),
  issuingOrganization: z.string().min(1).max(255),
  credentialId: z.string().max(100).optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
});

export const updateTrainerCertificationSchema = createTrainerCertificationSchema.partial();

// Trainer specialization schemas
export const createTrainerSpecializationSchema = z.object({
  specialization: z.string().min(1).max(100),
  yearsExperience: z.number().min(0).max(50).optional(),
  description: z.string().max(1000).optional(),
});

export const updateTrainerSpecializationSchema = createTrainerSpecializationSchema.partial();

// Progress photo schemas
export const createProgressPhotoSchema = z.object({
  photoType: photoTypeSchema,
  notes: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
  takenAt: z.string().datetime().optional(),
});

// Type exports
export type CreateUserProfileRequest = z.infer<typeof createUserProfileSchema>;
export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;
export type CreateUserMeasurementRequest = z.infer<typeof createUserMeasurementSchema>;
export type CreateUserHealthRequest = z.infer<typeof createUserHealthSchema>;
export type UpdateUserHealthRequest = z.infer<typeof updateUserHealthSchema>;
export type CreateUserGoalRequest = z.infer<typeof createUserGoalSchema>;
export type UpdateUserGoalRequest = z.infer<typeof updateUserGoalSchema>;
export type CreateTrainerCertificationRequest = z.infer<typeof createTrainerCertificationSchema>;
export type UpdateTrainerCertificationRequest = z.infer<typeof updateTrainerCertificationSchema>;
export type CreateTrainerSpecializationRequest = z.infer<typeof createTrainerSpecializationSchema>;
export type UpdateTrainerSpecializationRequest = z.infer<typeof updateTrainerSpecializationSchema>;
export type CreateProgressPhotoRequest = z.infer<typeof createProgressPhotoSchema>;

// Response types
export interface UserProfileResponse {
  success: true;
  message: string;
  data: {
    profile: {
      id: string;
      bio: string | null;
      dateOfBirth: string | null;
      gender: string | null;
      phone: string | null;
      timezone: string | null;
      preferredUnits: 'metric' | 'imperial';
      profilePhotoUrl: string | null;
      coverPhotoUrl: string | null;
      isPublic: boolean;
      completedAt: string | null;
      createdAt: string;
      updatedAt: string | null;
    };
  };
}

export interface UserMeasurementResponse {
  success: true;
  message: string;
  data: {
    measurement: {
      id: string;
      height: number | null;
      weight: number | null;
      bodyFatPercentage: number | null;
      muscleMass: number | null;
      measurements: Record<string, number> | null;
      recordedAt: string;
    };
  };
}

export interface UserMeasurementHistoryResponse {
  success: true;
  message: string;
  data: {
    measurements: Array<{
      id: string;
      height: number | null;
      weight: number | null;
      bodyFatPercentage: number | null;
      muscleMass: number | null;
      measurements: Record<string, number> | null;
      recordedAt: string;
    }>;
  };
}

export interface UserHealthResponse {
  success: true;
  message: string;
  data: {
    health: {
      id: string;
      bloodType: string | null;
      medicalConditions: string[];
      medications: string[];
      allergies: string[];
      injuries: Record<string, any> | null;
      surgeries: Record<string, any> | null;
      familyHistory: Record<string, any> | null;
      lifestyle: Record<string, any> | null;
      lastPhysicalExam: string | null;
      emergencyContact: Record<string, any> | null;
      createdAt: string;
      updatedAt: string | null;
    };
  };
}

export interface UserGoalsResponse {
  success: true;
  message: string;
  data: {
    goals: Array<{
      id: string;
      goalType: string;
      specificGoal: string | null;
      targetValue: number | null;
      targetDate: string | null;
      priority: number | null;
      isActive: boolean;
      achievedAt: string | null;
      createdAt: string;
    }>;
  };
}

export interface TrainerCertificationsResponse {
  success: true;
  message: string;
  data: {
    certifications: Array<{
      id: string;
      certificationName: string;
      issuingOrganization: string;
      credentialId: string | null;
      issueDate: string | null;
      expiryDate: string | null;
      documentUrl: string | null;
      isVerified: boolean;
      verifiedAt: string | null;
      createdAt: string;
    }>;
  };
}

export interface ProfileCompletionResponse {
  success: true;
  message: string;
  data: {
    completion: {
      id: string;
      basicInfo: boolean;
      profilePhoto: boolean;
      healthInfo: boolean;
      goalsSet: boolean;
      measurements: boolean;
      certifications: boolean;
      completionPercentage: number;
      lastUpdated: string;
    };
  };
}