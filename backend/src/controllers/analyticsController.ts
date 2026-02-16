import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Validation schemas
const bodyMeasurementSchema = z.object({
  userId: z.string().uuid(),
  measurementDate: z.string(),
  weight: z.number().positive().optional(),
  bodyFatPercentage: z.number().min(0).max(50).optional(),
  muscleMass: z.number().positive().optional(),
  measurements: z.object({
    chest: z.number().positive().optional(),
    waist: z.number().positive().optional(),
    hips: z.number().positive().optional(),
    biceps: z.number().positive().optional(),
    thighs: z.number().positive().optional(),
    neck: z.number().positive().optional(),
    shoulders: z.number().positive().optional(),
    forearms: z.number().positive().optional(),
    calves: z.number().positive().optional(),
  }).optional(),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

const performanceMetricSchema = z.object({
  userId: z.string().uuid(),
  exerciseId: z.string().uuid().optional(),
  metricType: z.enum(['one_rm', 'volume', 'endurance', 'power', 'speed', 'body_weight', 'body_fat', 'muscle_mass']),
  value: z.number(),
  unit: z.string(),
  workoutLogId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const goalProgressSchema = z.object({
  currentValue: z.number(),
  notes: z.string().optional(),
  recordedDate: z.string(),
});

export class AnalyticsController {
  // Body Measurements
  static async getBodyMeasurements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId: requestedUserId } = req.params;
      const { timeRange } = req.query;
      
      // Ensure user can only access their own data or trainer can access client data
      let userId = req.user!.id;
      
      // If trainer is requesting another user's data, verify trainer-client relationship
      if (requestedUserId !== req.user!.id) {
        if (req.user!.role !== 'trainer' && req.user!.role !== 'admin') {
          res.status(403).json({ message: 'Access denied' });
          return;
        }
        
        // TODO: Add trainer-client relationship verification
        // For now, trainers and admins can access any user's data
        userId = requestedUserId!;
      }

      const whereClause: any = { userId };

      // Add time range filter if provided
      if (timeRange) {
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '3m':
            startDate.setMonth(endDate.getMonth() - 3);
            break;
          case '6m':
            startDate.setMonth(endDate.getMonth() - 6);
            break;
          case '1y':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        }

        whereClause.recordedAt = {
          gte: startDate,
          lte: endDate,
        };
      }

      const measurements = await prisma.userMeasurement.findMany({
        where: whereClause,
        orderBy: { recordedAt: 'desc' },
      });

      res.json(measurements);
    } catch (error) {
      logger.error('Error fetching body measurements:', error);
      next(error);
    }
  }

  static async saveBodyMeasurement(req: Request, res: Response, next: NextFunction) {
    try {
      // Remove userId from validation schema since it should come from auth
      const { userId: _, ...bodyData } = req.body;
      const validatedData = bodyMeasurementSchema.omit({ userId: true }).parse(bodyData);
      
      // Use authenticated user's ID
      const userId = req.user!.id;

      const measurement = await prisma.userMeasurement.create({
        data: {
          userId,
          recordedAt: new Date(validatedData.measurementDate),
          weight: validatedData.weight,
          bodyFatPercentage: validatedData.bodyFatPercentage,
          muscleMass: validatedData.muscleMass,
          measurements: validatedData.measurements || {},
        },
      });

      // Create performance metrics for weight, body fat, and muscle mass
      const metrics = [];
      
      if (validatedData.weight) {
        metrics.push({
          userId,
          metricType: 'body_weight' as const,
          value: validatedData.weight,
          unit: 'kg',
        });
      }
      
      if (validatedData.bodyFatPercentage) {
        metrics.push({
          userId,
          metricType: 'body_fat' as const,
          value: validatedData.bodyFatPercentage,
          unit: '%',
        });
      }
      
      if (validatedData.muscleMass) {
        metrics.push({
          userId,
          metricType: 'muscle_mass' as const,
          value: validatedData.muscleMass,
          unit: 'kg',
        });
      }

      // Create performance metrics
      if (metrics.length > 0) {
        await prisma.performanceMetric.createMany({
          data: metrics,
        });
      }

      // Check for milestones and insights
      await AnalyticsController.checkMilestones(userId, measurement);

      res.status(201).json(measurement);
    } catch (error) {
      logger.error('Error saving body measurement:', error);
      next(error);
    }
  }

  static async updateBodyMeasurement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      // Remove userId from request data since it should come from auth
      const { userId: _, ...bodyData } = req.body;
      const validatedData = bodyMeasurementSchema.omit({ userId: true }).partial().parse(bodyData);

      // Verify the measurement belongs to the authenticated user
      const existingMeasurement = await prisma.userMeasurement.findUnique({
        where: { id },
      });

      if (!existingMeasurement || existingMeasurement.userId !== userId) {
        res.status(404).json({ message: 'Measurement not found' });
        return;
      }

      const measurement = await prisma.userMeasurement.update({
        where: { id },
        data: {
          recordedAt: validatedData.measurementDate ? new Date(validatedData.measurementDate) : undefined,
          weight: validatedData.weight,
          bodyFatPercentage: validatedData.bodyFatPercentage,
          muscleMass: validatedData.muscleMass,
          measurements: validatedData.measurements,
        },
      });

      res.json(measurement);
    } catch (error) {
      logger.error('Error updating body measurement:', error);
      next(error);
    }
  }

  static async deleteBodyMeasurement(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Verify the measurement belongs to the authenticated user
      const existingMeasurement = await prisma.userMeasurement.findUnique({
        where: { id },
      });

      if (!existingMeasurement || existingMeasurement.userId !== userId) {
        res.status(404).json({ message: 'Measurement not found' });
        return;
      }

      await prisma.userMeasurement.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting body measurement:', error);
      next(error);
    }
  }

  // Performance Metrics
  static async getPerformanceMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: requestedUserId, exerciseId } = req.query;
      
      // Use authenticated user's ID or allow trainers to access client data
      let userId = req.user!.id;
      
      if (requestedUserId && requestedUserId !== req.user!.id) {
        if (req.user!.role !== 'trainer' && req.user!.role !== 'admin') {
          res.status(403).json({ message: 'Access denied' });
          return;
        }
        userId = requestedUserId as string;
      }

      const whereClause: any = { userId };
      if (exerciseId) {
        whereClause.exerciseId = exerciseId as string;
      }

      const metrics = await prisma.performanceMetric.findMany({
        where: whereClause,
        include: {
          exercise: true,
        },
        orderBy: { recordedAt: 'desc' },
      });

      res.json(metrics);
    } catch (error) {
      logger.error('Error fetching performance metrics:', error);
      next(error);
    }
  }

  static async recordPerformanceMetric(req: Request, res: Response, next: NextFunction) {
    try {
      // Remove userId from request data since it should come from auth
      const { userId: _, ...metricData } = req.body;
      const validatedData = performanceMetricSchema.omit({ userId: true }).parse(metricData);
      
      // Use authenticated user's ID
      const userId = req.user!.id;

      const metric = await prisma.performanceMetric.create({
        data: {
          ...validatedData,
          userId,
        },
        include: {
          exercise: true,
        },
      });

      res.status(201).json(metric);
    } catch (error) {
      logger.error('Error recording performance metric:', error);
      next(error);
    }
  }

  static async getPersonalBests(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: requestedUserId } = req.params;
      
      // Use authenticated user's ID or allow trainers to access client data
      let userId = req.user!.id;
      
      if (requestedUserId !== req.user!.id) {
        if (req.user!.role !== 'trainer' && req.user!.role !== 'admin') {
          res.status(403).json({ message: 'Access denied' });
          return;
        }
        userId = requestedUserId!;
      }

      const personalBests = await prisma.performanceMetric.groupBy({
        by: ['exerciseId', 'metricType'],
        where: {
          userId,
          exerciseId: { not: null },
        },
        _max: {
          value: true,
          recordedAt: true,
        },
      });

      // Get exercise details
      const exerciseIds = personalBests.map(pb => pb.exerciseId).filter(Boolean) as string[];
      const exercises = await prisma.exercise.findMany({
        where: { id: { in: exerciseIds } },
      });

      const result = personalBests.map(pb => {
        const exercise = exercises.find(e => e.id === pb.exerciseId);
        return {
          exercise: exercise?.name || 'Unknown Exercise',
          metric: pb.metricType,
          value: pb._max.value!,
          date: pb._max.recordedAt!.toISOString().split('T')[0],
        };
      });

      res.json(result);
    } catch (error) {
      logger.error('Error fetching personal bests:', error);
      next(error);
    }
  }

  // Training Load
  static async getTrainingLoad(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: requestedUserId } = req.params;
      const weeks = parseInt(req.query.weeks as string) || 12;
      
      // Use authenticated user's ID or allow trainers to access client data
      let userId = req.user!.id;
      
      if (requestedUserId !== req.user!.id) {
        if (req.user!.role !== 'trainer' && req.user!.role !== 'admin') {
          res.status(403).json({ message: 'Access denied' });
          return;
        }
        userId = requestedUserId!;
      }

      const trainingLoad = await prisma.trainingLoad.findMany({
        where: { userId },
        orderBy: { weekStartDate: 'desc' },
        take: weeks,
      });

      res.json(trainingLoad.reverse()); // Return in chronological order
    } catch (error) {
      logger.error('Error fetching training load:', error);
      next(error);
    }
  }

  static async calculateWeeklyLoad(req: Request, res: Response, next: NextFunction) {
    try {
      const { weekStartDate } = req.body;
      const userId = req.user!.id; // Use authenticated user's ID
      
      const startDate = new Date(weekStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);

      // This would typically involve complex calculations based on workout logs
      // For now, we'll create a simplified version
      const trainingLoad = await prisma.trainingLoad.upsert({
        where: {
          userId_weekStartDate: {
            userId,
            weekStartDate: startDate,
          },
        },
        create: {
          userId,
          weekStartDate: startDate,
          totalVolume: 0,
          totalSets: 0,
          totalReps: 0,
          trainingDays: 0,
          acuteLoad: 0,
          chronicLoad: 0,
          loadRatio: 0,
        },
        update: {
          calculatedAt: new Date(),
        },
      });

      res.json(trainingLoad);
    } catch (error) {
      logger.error('Error calculating weekly load:', error);
      next(error);
    }
  }

  // Goal Progress
  static async getGoalProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { goalId } = req.params;

      const progress = await prisma.goalProgress.findMany({
        where: { goalId },
        orderBy: { recordedDate: 'asc' },
      });

      res.json(progress);
    } catch (error) {
      logger.error('Error fetching goal progress:', error);
      next(error);
    }
  }

  static async updateGoalProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { goalId } = req.params;
      const validatedData = goalProgressSchema.parse(req.body);

      // Get the goal to calculate percentage
      const goal = await prisma.userGoal.findUnique({
        where: { id: goalId },
      });

      if (!goal) {
        res.status(404).json({ message: 'Goal not found' });
        return;
      }

      let percentageComplete = 0;
      if (goal.targetValue) {
        percentageComplete = Math.min(100, (validatedData.currentValue / Number(goal.targetValue)) * 100);
      }

      const progressData: any = {
        goalId: goalId,
        recordedDate: new Date(validatedData.recordedDate),
        currentValue: validatedData.currentValue,
        percentageComplete,
      };
      
      if (validatedData.notes) {
        progressData.notes = validatedData.notes;
      }

      const progress = await prisma.goalProgress.create({
        data: progressData,
      });

      // Check if goal is achieved
      if (percentageComplete >= 100 && !goal.achievedAt) {
        await prisma.userGoal.update({
          where: { id: goalId },
          data: { achievedAt: new Date() },
        });

        // Create achievement milestone
        await prisma.milestoneAchievement.create({
          data: {
            userId: goal.userId,
            milestoneType: 'goal_achievement',
            title: `Goal Achieved: ${goal.goalType}`,
            description: `Congratulations! You've achieved your ${goal.goalType} goal.`,
            achievedValue: validatedData.currentValue,
          },
        });
      }

      res.status(201).json(progress);
    } catch (error) {
      logger.error('Error updating goal progress:', error);
      next(error);
    }
  }

  // User Insights
  static async getUserInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: requestedUserId } = req.params;
      const { unreadOnly } = req.query;
      
      // Use authenticated user's ID or allow trainers to access client data
      let userId = req.user!.id;
      
      if (requestedUserId !== req.user!.id) {
        if (req.user!.role !== 'trainer' && req.user!.role !== 'admin') {
          res.status(403).json({ message: 'Access denied' });
          return;
        }
        userId = requestedUserId!;
      }

      const whereClause: any = { userId };
      if (unreadOnly === 'true') {
        whereClause.isRead = false;
      }

      const insights = await prisma.userInsight.findMany({
        where: whereClause,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      res.json(insights);
    } catch (error) {
      logger.error('Error fetching user insights:', error);
      next(error);
    }
  }

  static async markInsightAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { insightId } = req.params;

      await prisma.userInsight.update({
        where: { id: insightId },
        data: { isRead: true },
      });

      res.status(200).send();
    } catch (error) {
      logger.error('Error marking insight as read:', error);
      next(error);
    }
  }

  static async markInsightActionTaken(req: Request, res: Response, next: NextFunction) {
    try {
      const { insightId } = req.params;

      await prisma.userInsight.update({
        where: { id: insightId },
        data: { actionTaken: true },
      });

      res.status(200).send();
    } catch (error) {
      logger.error('Error marking insight action taken:', error);
      next(error);
    }
  }

  // Milestone Achievements
  static async getMilestoneAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: requestedUserId } = req.params;
      
      // Use authenticated user's ID or allow trainers to access client data
      let userId = req.user!.id;
      
      if (requestedUserId !== req.user!.id) {
        if (req.user!.role !== 'trainer' && req.user!.role !== 'admin') {
          res.status(403).json({ message: 'Access denied' });
          return;
        }
        userId = requestedUserId!;
      }

      const milestones = await prisma.milestoneAchievement.findMany({
        where: { userId },
        orderBy: { achievedAt: 'desc' },
      });

      res.json(milestones);
    } catch (error) {
      logger.error('Error fetching milestone achievements:', error);
      next(error);
    }
  }

  // Dashboard Data
  static async getDashboardData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId: requestedUserId } = req.params;
      
      // Use authenticated user's ID or allow trainers to access client data
      let userId = req.user!.id;
      
      if (requestedUserId !== req.user!.id) {
        if (req.user!.role !== 'trainer' && req.user!.role !== 'admin') {
          res.status(403).json({ message: 'Access denied' });
          return;
        }
        userId = requestedUserId!;
      }

      // Get user basic info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userProfile: true,
        },
      });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Get current measurements
      const currentMeasurements = await prisma.userMeasurement.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
      });

      // Get recent insights (unread, high priority first)
      const recentInsights = await prisma.userInsight.findMany({
        where: { userId },
        orderBy: [
          { isRead: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 5,
      });

      // Build dashboard data
      const dashboardData = {
        user: {
          id: user.id,
          name: `${user.userProfile?.bio || user.email}`,
          profilePhoto: user.userProfile?.profilePhotoUrl,
        },
        summary: {
          totalWorkouts: 0, // Would be calculated from workout logs
          thisWeekWorkouts: 0,
          currentStreak: 0,
          adherenceRate: 0,
          totalVolume: 0,
          strengthGains: 0,
        },
        currentMeasurements,
        recentInsights,
        upcomingMilestones: [],
        chartData: {
          weightProgress: [],
          strengthProgress: [],
          volumeProgression: [],
          trainingLoad: [],
        },
      };

      res.json(dashboardData);
    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
      next(error);
    }
  }

  // Helper Methods
  private static async checkMilestones(userId: string, measurement: any) {
    try {
      // Check for weight milestones
      if (measurement.weight) {
        const previousMeasurements = await prisma.userMeasurement.findMany({
          where: { userId, recordedAt: { lt: measurement.recordedAt } },
          orderBy: { recordedAt: 'desc' },
          take: 10,
        });

        const firstMeasurement = previousMeasurements[previousMeasurements.length - 1];
        if (firstMeasurement?.weight && measurement.weight) {
          const weightChange = Number(measurement.weight) - Number(firstMeasurement.weight);
          
          // Weight loss milestone
          if (weightChange <= -5) {
            await prisma.milestoneAchievement.create({
              data: {
                userId,
                milestoneType: 'weight_loss',
                title: 'Weight Loss Milestone',
                description: `Congratulations! You've lost ${Math.abs(weightChange).toFixed(1)} kg since you started tracking.`,
                achievedValue: Math.abs(weightChange),
              },
            });
          }
        }
      }

      // Generate insights based on trends
      await AnalyticsController.generateInsights(userId, measurement);
    } catch (error) {
      logger.error('Error checking milestones:', error);
    }
  }

  private static async generateInsights(userId: string, measurement: any) {
    try {
      const recentMeasurements = await prisma.userMeasurement.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: 5,
      });

      if (recentMeasurements.length >= 3) {
        const weights = recentMeasurements
          .filter(m => m.weight)
          .map(m => Number(m.weight))
          .slice(0, 3);

        if (weights.length === 3) {
          const trend = (weights[0] || 0) - (weights[2] || 0); // Recent - oldest
          
          if (Math.abs(trend) >= 1) {
            const insightType = trend > 0 ? 'weight_gain_trend' : 'weight_loss_trend';
            const title = trend > 0 ? 'Weight Gain Trend Detected' : 'Weight Loss Trend Detected';
            const description = `Your weight has ${trend > 0 ? 'increased' : 'decreased'} by ${Math.abs(trend).toFixed(1)} kg over your last 3 measurements. ${
              trend > 0 
                ? 'If this is unintentional, consider reviewing your diet and exercise routine.' 
                : 'Great progress! Keep up the good work.'
            }`;

            await prisma.userInsight.create({
              data: {
                userId,
                insightType,
                title,
                description,
                priority: Math.abs(trend) >= 2 ? 'high' : 'medium',
                data: { trend, measurements: weights },
              },
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error generating insights:', error);
    }
  }
}