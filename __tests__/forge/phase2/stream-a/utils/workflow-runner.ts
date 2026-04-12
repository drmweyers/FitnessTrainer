/**
 * FORGE Workflow Runner - Stream A
 * Executes multi-step user workflows for simulation testing
 */

import { Actor } from './actor-factory';

export interface WorkflowStep {
  action: string;
  data?: Record<string, any>;
  expectedOutcome?: string;
}

export interface WorkflowResult {
  success: boolean;
  stepsCompleted: number;
  totalSteps: number;
  data: Record<string, any>;
  errors: string[];
  duration: number;
}

export interface WorkflowContext {
  actor: Actor;
  state: Record<string, any>;
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

export class WorkflowRunner {
  static async run(options: {
    actor: Actor;
    steps: WorkflowStep[];
    context?: Partial<WorkflowContext>;
  }): Promise<WorkflowResult> {
    const startTime = Date.now();
    const result: WorkflowResult = {
      success: true,
      stepsCompleted: 0,
      totalSteps: options.steps.length,
      data: {},
      errors: [],
      duration: 0,
    };

    const context: WorkflowContext = {
      actor: options.actor,
      state: options.context?.state || {},
      tokens: options.context?.tokens,
    };

    for (let i = 0; i < options.steps.length; i++) {
      const step = options.steps[i];

      try {
        const stepResult = await this.executeStep(step, context);
        result.stepsCompleted++;

        if (stepResult) {
          Object.assign(result.data, stepResult);
          Object.assign(context.state, stepResult);
        }
      } catch (error) {
        result.success = false;
        result.errors.push(`Step ${i + 1} (${step.action}): ${error instanceof Error ? error.message : 'Unknown error'}`);
        break;
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  private static async executeStep(
    step: WorkflowStep,
    context: WorkflowContext
  ): Promise<Record<string, any> | null> {
    switch (step.action) {
      case 'register':
        return this.handleRegister(step.data, context);

      case 'verifyEmail':
        return this.handleVerifyEmail(step.data, context);

      case 'login':
        return this.handleLogin(step.data, context);

      case 'completeProfile':
        return this.handleCompleteProfile(step.data, context);

      case 'updateProfile':
        return this.handleUpdateProfile(step.data, context);

      case 'uploadPhoto':
        return this.handleUploadPhoto(step.data, context);

      case 'completeHealthQuestionnaire':
        return this.handleHealthQuestionnaire(step.data, context);

      case 'setFitnessGoals':
        return this.handleSetFitnessGoals(step.data, context);

      case 'addCertification':
        return this.handleAddCertification(step.data, context);

      case 'uploadProgressPhoto':
        return this.handleUploadProgressPhoto(step.data, context);

      case 'enable2FA':
        return this.handleEnable2FA(step.data, context);

      case 'verify2FA':
        return this.handleVerify2FA(step.data, context);

      case 'resetPassword':
        return this.handleResetPassword(step.data, context);

      case 'logout':
        return this.handleLogout(step.data, context);

      case 'refreshToken':
        return this.handleRefreshToken(step.data, context);

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  }

  private static async handleRegister(
    data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    // Simulate registration API call
    const registrationData = {
      email: data.email !== undefined ? data.email : context.actor.email,
      password: data.password !== undefined ? data.password : context.actor.password,
      role: data.role || context.actor.role,
      agreeToTerms: data.agreeToTerms ?? true,
      agreeToPrivacy: data.agreeToPrivacy ?? true,
    };

    // Validate required fields
    if (!registrationData.email || registrationData.email === '') {
      throw new Error('Email and password are required');
    }

    if (!registrationData.password || registrationData.password === '') {
      throw new Error('Email and password are required');
    }

    if (!registrationData.agreeToTerms || !registrationData.agreeToPrivacy) {
      throw new Error('Terms and privacy agreement required');
    }

    // Simulate successful registration
    return {
      registrationSuccess: true,
      userId: context.actor.id,
      email: registrationData.email,
      role: registrationData.role,
      isVerified: false,
      verificationToken: `verify-${Date.now()}`,
    };
  }

  private static async handleVerifyEmail(
    data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    const token = data.token !== undefined ? data.token : context.state.verificationToken;

    if (!token || token === '') {
      throw new Error('Verification token is required');
    }

    if (token === 'invalid-token') {
      throw new Error('Invalid or expired verification token');
    }

    return {
      verificationSuccess: true,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    };
  }

  private static async handleLogin(
    data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    const credentials = {
      email: data.email || context.actor.email,
      password: data.password || context.actor.password,
      rememberMe: data.rememberMe ?? false,
    };

    // Simulate login validation
    if (credentials.password !== context.actor.password) {
      throw new Error('Invalid credentials');
    }

    if (!context.actor.isVerified) {
      throw new Error('Email not verified');
    }

    const tokens = {
      accessToken: `access-${Date.now()}`,
      refreshToken: `refresh-${Date.now()}`,
      expiresIn: 900, // 15 minutes
    };

    context.tokens = tokens;

    return {
      loginSuccess: true,
      user: {
        id: context.actor.id,
        email: credentials.email,
        role: context.actor.role,
      },
      ...tokens,
    };
  }

  private static async handleCompleteProfile(
    data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    const profileData: Record<string, any> = {
      bio: data.bio || '',
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      phone: data.phone,
      timezone: data.timezone || 'UTC',
      preferredUnits: data.preferredUnits || 'metric',
      ...data,
    };

    // Calculate completion percentage
    const requiredFields = ['bio'];
    const optionalFields = ['dateOfBirth', 'gender', 'phone', 'timezone', 'preferredUnits'];

    const requiredComplete = requiredFields.filter(f => profileData[f]).length;
    const optionalComplete = optionalFields.filter(f => profileData[f]).length;

    const completionPercentage = Math.round(
      ((requiredComplete + optionalComplete * 0.5) / (requiredFields.length + optionalFields.length * 0.5)) * 100
    );

    return {
      profileCreated: true,
      profileData,
      completionPercentage,
      profileCompletion: completionPercentage,
    };
  }

  private static async handleUpdateProfile(
    data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    const currentData = context.state.profileData || {};

    const updatedData = {
      ...currentData,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return {
      profileUpdated: true,
      profileData: updatedData,
      changes: Object.keys(data),
    };
  }

  private static async handleUploadPhoto(
    data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    const file = data.file;

    if (!file && !data.skipValidation) {
      throw new Error('Photo file is required');
    }

    if (data.invalidFormat) {
      throw new Error('Invalid file format. Supported: JPG, PNG, WebP');
    }

    if (data.file?.size && data.file.size > 5 * 1024 * 1024) {
      throw new Error('File size exceeds 5MB limit');
    }

    return {
      photoUploaded: true,
      photoUrl: `https://cdn.evofit.io/photos/${context.actor.id}/profile.jpg`,
      thumbnailUrl: `https://cdn.evofit.io/photos/${context.actor.id}/profile-thumb.jpg`,
      uploadedAt: new Date().toISOString(),
    };
  }

  private static async handleHealthQuestionnaire(
    data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    const healthData = {
      bloodType: data.bloodType,
      medicalConditions: data.medicalConditions || [],
      medications: data.medications || [],
      allergies: data.allergies || [],
      injuries: data.injuries || [],
      lifestyle: data.lifestyle || {},
      emergencyContact: data.emergencyContact,
      ...data,
    };

    const isComplete = healthData.medicalConditions.length > 0 &&
                       healthData.emergencyContact?.name;

    return {
      healthQuestionnaireCompleted: isComplete,
      healthData,
      completedSections: ['medicalConditions', 'emergencyContact'],
      isComplete,
    };
  }

  private static async handleSetFitnessGoals(
    data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    const goals = data.goals || [data];

    const processedGoals = goals.map((goal: any, index: number) => ({
      id: `goal-${Date.now()}-${index}`,
      goalType: goal.goalType || 'GENERAL_FITNESS',
      specificGoal: goal.specificGoal,
      targetValue: goal.targetValue,
      unit: goal.unit,
      targetDate: goal.targetDate,
      priority: goal.priority || index + 1,
      isActive: true,
      progressPercentage: 0,
      createdAt: new Date().toISOString(),
    }));

    return {
      goalsSet: true,
      goals: processedGoals,
      goalCount: processedGoals.length,
    };
  }

  private static async handleAddCertification(
    data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    if (context.actor.role !== 'trainer') {
      throw new Error('Only trainers can add certifications');
    }

    const certification = {
      id: `cert-${Date.now()}`,
      certificationName: data.certificationName,
      issuingOrganization: data.issuingOrganization,
      credentialId: data.credentialId,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      isVerified: false,
      isPublic: data.isPublic ?? true,
      createdAt: new Date().toISOString(),
    };

    return {
      certificationAdded: true,
      certification,
    };
  }

  private static async handleUploadProgressPhoto(
    data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    const photo = {
      id: `photo-${Date.now()}`,
      photoUrl: `https://cdn.evofit.io/progress/${context.actor.id}/${Date.now()}.jpg`,
      photoType: data.photoType || 'FRONT',
      notes: data.notes,
      takenAt: data.takenAt || new Date().toISOString(),
      isPrivate: data.isPrivate ?? true,
      sharedWithTrainer: data.sharedWithTrainer ?? false,
    };

    return {
      progressPhotoUploaded: true,
      photo,
    };
  }

  private static async handleEnable2FA(
    data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    return {
      twoFactorSetup: true,
      secret: `2fa-secret-${Date.now()}`,
      qrCode: `data:image/png;base64,${Buffer.from('mock-qr-code').toString('base64')}`,
      backupCodes: Array.from({ length: 10 }, (_, i) => `BACKUP${String(i + 1).padStart(4, '0')}`),
    };
  }

  private static async handleVerify2FA(
    data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    const token = data.token;

    if (!token || token.length !== 6) {
      throw new Error('Valid 6-digit code required');
    }

    if (token === '000000') {
      throw new Error('Invalid 2FA code');
    }

    return {
      twoFactorEnabled: true,
      verified: true,
    };
  }

  private static async handleResetPassword(
    data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    const { email, newPassword, token } = data;

    if (!token) {
      // Request reset
      return {
        resetRequested: true,
        message: 'If an account exists with this email, a reset link has been sent.',
      };
    }

    if (token === 'invalid-token') {
      throw new Error('Invalid or expired reset token');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    context.actor.password = newPassword;

    return {
      passwordReset: true,
      message: 'Password reset successfully',
    };
  }

  private static async handleLogout(
    _data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    context.tokens = undefined;

    return {
      loggedOut: true,
      message: 'Successfully logged out',
    };
  }

  private static async handleRefreshToken(
    _data: Record<string, any> = {},
    context: WorkflowContext
  ): Promise<Record<string, any>> {
    if (!context.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const newTokens = {
      accessToken: `access-refreshed-${Date.now()}`,
      refreshToken: `refresh-rotated-${Date.now()}`,
      expiresIn: 900,
    };

    context.tokens = newTokens;

    return {
      tokenRefreshed: true,
      ...newTokens,
    };
  }
}

export default WorkflowRunner;
