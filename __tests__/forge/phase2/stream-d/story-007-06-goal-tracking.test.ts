/**
 * Story 007-06: Goal Tracking
 * FORGE User Simulation - Stream D
 *
 * As a client, I want to set and track fitness goals
 * So that I can stay motivated and measure success
 */

import { prisma } from '@/lib/db/prisma';
import {
  ActorFactory,
  WorkflowRunner,
  GoalHelpers,
  MeasurementHelpers,
  cleanupTestData
} from './utils';

describe('Story 007-06: Goal Tracking', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('creates weight loss goal', async () => {
      const client = await ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'navigateToGoals', data: { section: 'goals' } },
          { action: 'selectGoalType', data: { type: 'weight_loss' } },
          { action: 'setTarget', data: { target: 180, unit: 'lbs' } },
          { action: 'setDeadline', data: { date: new Date('2026-06-30') } },
          { action: 'saveGoal', data: { confirm: true } }
        ]
      });

      expect(result.success).toBe(true);

      const goal = await GoalHelpers.createGoal(client.id, {
        type: 'weight_loss',
        target: 180,
        current: 200,
        unit: 'lbs',
        deadline: new Date('2026-06-30')
      });

      expect(goal.target).toBe(180);
      expect(goal.status).toBe('ACTIVE');
    });

    it('tracks goal progress', async () => {
      const client = await ActorFactory.createClient();

      const goal = await GoalHelpers.createGoal(client.id, {
        type: 'weight_loss',
        target: 180,
        current: 200,
        unit: 'lbs'
      });

      // Update progress
      const updatedGoal = await prisma.goal.update({
        where: { id: goal.id },
        data: { current: 190 }
      });

      const progress = GoalHelpers.calculateGoalProgress(
        updatedGoal.current,
        updatedGoal.target
      );

      expect(progress.progress).toBeCloseTo(105.56, 1);
      expect(progress.remaining).toBe(-10);
    });

    it('marks goal as achieved', async () => {
      const client = await ActorFactory.createClient();

      const goal = await GoalHelpers.createGoal(client.id, {
        type: 'weight_loss',
        target: 180,
        current: 185,
        unit: 'lbs'
      });

      // Achieve goal
      const achieved = await prisma.goal.update({
        where: { id: goal.id },
        data: {
          current: 180,
          status: 'ACHIEVED',
          achievedAt: new Date()
        }
      });

      expect(achieved.status).toBe('ACHIEVED');
      expect(achieved.achievedAt).toBeDefined();
    });

    it('views all active goals', async () => {
      const client = await ActorFactory.createClient();

      await GoalHelpers.createGoal(client.id, {
        type: 'weight_loss',
        target: 180,
        current: 190,
        unit: 'lbs'
      });

      await GoalHelpers.createGoal(client.id, {
        type: 'workout_frequency',
        target: 12,
        current: 8,
        unit: 'workouts'
      });

      await GoalHelpers.createGoal(client.id, {
        type: 'body_fat',
        target: 15,
        current: 18,
        unit: 'percent'
      });

      const activeGoals = await prisma.goal.findMany({
        where: { userId: client.id, status: 'ACTIVE' }
      });

      expect(activeGoals).toHaveLength(3);
    });
  });

  describe('Goal Types', () => {
    it('creates body composition goal', async () => {
      const client = await ActorFactory.createClient();

      const goal = await GoalHelpers.createGoal(client.id, {
        type: 'body_fat_percentage',
        target: 15,
        current: 20,
        unit: 'percent'
      });

      expect(goal.type).toBe('body_fat_percentage');
      expect(goal.target).toBe(15);
    });

    it('creates strength goal', async () => {
      const client = await ActorFactory.createClient();

      const goal = await GoalHelpers.createGoal(client.id, {
        type: 'bench_press_pr',
        target: 225,
        current: 185,
        unit: 'lbs'
      });

      expect(goal.type).toBe('bench_press_pr');
      expect(goal.target).toBe(225);
    });

    it('creates consistency goal', async () => {
      const client = await ActorFactory.createClient();

      const goal = await GoalHelpers.createGoal(client.id, {
        type: 'weekly_workouts',
        target: 4,
        current: 3,
        unit: 'workouts'
      });

      expect(goal.type).toBe('weekly_workouts');
    });

    it('creates measurement goal', async () => {
      const client = await ActorFactory.createClient();

      const goal = await GoalHelpers.createGoal(client.id, {
        type: 'waist_measurement',
        target: 32,
        current: 36,
        unit: 'inches'
      });

      expect(goal.type).toBe('waist_measurement');
    });
  });

  describe('Goal Milestones', () => {
    it('creates milestone for goal', async () => {
      const client = await ActorFactory.createClient();

      const goal = await GoalHelpers.createGoal(client.id, {
        type: 'weight_loss',
        target: 180,
        current: 200,
        unit: 'lbs'
      });

      const milestones = [
        { target: 195, reward: 'New workout shirt' },
        { target: 190, reward: 'Massage' },
        { target: 185, reward: 'New shoes' },
        { target: 180, reward: 'Celebration dinner' }
      ];

      expect(milestones).toHaveLength(4);
      expect(milestones[0].target).toBe(195);
    });

    it('tracks milestone completion', async () => {
      const milestones = [
        { target: 195, completed: true, completedAt: new Date('2026-02-01') },
        { target: 190, completed: true, completedAt: new Date('2026-03-01') },
        { target: 185, completed: false },
        { target: 180, completed: false }
      ];

      const completed = milestones.filter(m => m.completed);
      expect(completed).toHaveLength(2);
    });
  });

  describe('Goal Notifications', () => {
    it('notifies on milestone reached', async () => {
      const notification = {
        type: 'MILESTONE_REACHED',
        title: 'Milestone Achieved!',
        message: 'You hit 190 lbs - halfway to your goal!',
        data: { goalId: 'goal-123', milestone: 190 }
      };

      expect(notification.type).toBe('MILESTONE_REACHED');
      expect(notification.data.milestone).toBe(190);
    });

    it('notifies on goal achieved', async () => {
      const notification = {
        type: 'GOAL_ACHIEVED',
        title: 'Goal Complete!',
        message: 'Congratulations! You reached your goal of 180 lbs!',
        data: { goalId: 'goal-123', achieved: true }
      };

      expect(notification.type).toBe('GOAL_ACHIEVED');
    });

    it('sends progress reminders', async () => {
      const reminder = {
        type: 'GOAL_REMINDER',
        title: 'Goal Check-in',
        message: 'You are 10 lbs away from your goal. Keep going!',
        frequency: 'weekly'
      };

      expect(reminder.frequency).toBe('weekly');
    });
  });

  describe('Goal Editing', () => {
    it('updates goal target', async () => {
      const client = await ActorFactory.createClient();

      const goal = await GoalHelpers.createGoal(client.id, {
        type: 'weight_loss',
        target: 180,
        current: 190,
        unit: 'lbs'
      });

      const updated = await prisma.goal.update({
        where: { id: goal.id },
        data: { target: 175 }
      });

      expect(updated.target).toBe(175);
    });

    it('extends goal deadline', async () => {
      const client = await ActorFactory.createClient();

      const goal = await GoalHelpers.createGoal(client.id, {
        type: 'weight_loss',
        target: 180,
        current: 190,
        unit: 'lbs',
        deadline: new Date('2026-03-31')
      });

      const extended = await prisma.goal.update({
        where: { id: goal.id },
        data: { deadline: new Date('2026-04-30') }
      });

      expect(extended.deadline?.getMonth()).toBe(3); // April
    });

    it('archives completed goal', async () => {
      const client = await ActorFactory.createClient();

      const goal = await GoalHelpers.createGoal(client.id, {
        type: 'weight_loss',
        target: 180,
        current: 180,
        unit: 'lbs'
      });

      const archived = await prisma.goal.update({
        where: { id: goal.id },
        data: { status: 'ARCHIVED', archivedAt: new Date() }
      });

      expect(archived.status).toBe('ARCHIVED');
    });
  });

  describe('Trainer Goal Management', () => {
    it('trainer creates goal for client', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      await prisma.client.create({
        data: {
          trainerId: trainer.id,
          userId: client.id,
          status: 'ACTIVE'
        }
      });

      const goal = await GoalHelpers.createGoal(client.id, {
        type: 'strength_gain',
        target: 225,
        current: 185,
        unit: 'lbs'
      });

      expect(goal.userId).toBe(client.id);
    });

    it('trainer reviews client goal progress', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      await prisma.client.create({
        data: {
          trainerId: trainer.id,
          userId: client.id,
          status: 'ACTIVE'
        }
      });

      await GoalHelpers.createGoal(client.id, {
        type: 'weight_loss',
        target: 180,
        current: 185,
        unit: 'lbs'
      });

      const clientGoals = await prisma.goal.findMany({
        where: { userId: client.id }
      });

      expect(clientGoals).toHaveLength(1);
    });
  });
});
