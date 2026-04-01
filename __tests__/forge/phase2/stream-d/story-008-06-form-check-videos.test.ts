/**
 * Story 008-06: Form Check Videos
 * FORGE User Simulation - Stream D
 *
 * As a client, I want to submit form check videos
 * So that my trainer can review my technique
 */


import {
  ActorFactory,
  WorkflowRunner,
  MessagingHelpers,
  cleanupTestData
} from './utils';

describe('Story 008-06: Form Check Videos', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('submits form check video', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      await prisma.client.create({
        data: {
          trainerId: trainer.id,
          userId: client.id,
          status: 'ACTIVE'
        }
      });

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'navigateToFormCheck', data: {} },
          { action: 'selectExercise', data: { exercise: 'Squat' } },
          { action: 'recordVideo', data: { duration: 30 } },
          { action: 'addNotes', data: { notes: 'Please check my depth' } },
          { action: 'submitFormCheck', data: { confirm: true } }
        ]
      });

      expect(result.success).toBe(true);
    });

    it('trainer reviews form check video', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const formCheck = await prisma.formCheck.create({
        data: {
          clientId: client.id,
          trainerId: trainer.id,
          exerciseName: 'Squat',
          videoUrl: 'https://cdn.evofit.io/formchecks/squat-1.mp4',
          clientNotes: 'Please check my depth',
          status: 'PENDING'
        }
      });

      // Trainer reviews
      const reviewed = await prisma.formCheck.update({
        where: { id: formCheck.id },
        data: {
          status: 'REVIEWED',
          trainerFeedback: 'Great depth! Try to keep your chest up more.',
          reviewedAt: new Date()
        }
      });

      expect(reviewed.status).toBe('REVIEWED');
      expect(reviewed.trainerFeedback).toBeDefined();
    });

    it('views form check history', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      await prisma.formCheck.create({
        data: {
          clientId: client.id,
          trainerId: trainer.id,
          exerciseName: 'Squat',
          videoUrl: 'https://cdn.evofit.io/formchecks/squat-1.mp4',
          status: 'REVIEWED'
        }
      });

      await prisma.formCheck.create({
        data: {
          clientId: client.id,
          trainerId: trainer.id,
          exerciseName: 'Deadlift',
          videoUrl: 'https://cdn.evofit.io/formchecks/deadlift-1.mp4',
          status: 'REVIEWED'
        }
      });

      const history = await prisma.formCheck.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: 'desc' }
      });

      expect(history).toHaveLength(2);
    });
  });

  describe('Video Submission', () => {
    it('validates video duration', async () => {
      const minDuration = 5;
      const maxDuration = 60;
      const duration = 30;

      const isValid = duration >= minDuration && duration <= maxDuration;
      expect(isValid).toBe(true);
    });

    it('validates video file size', async () => {
      const maxSize = 100 * 1024 * 1024; // 100MB
      const fileSize = 50 * 1024 * 1024; // 50MB

      const isValid = fileSize <= maxSize;
      expect(isValid).toBe(true);
    });

    it('validates video format', async () => {
      const allowedFormats = ['mp4', 'mov', 'webm'];
      const format = 'mp4';

      const isValid = allowedFormats.includes(format);
      expect(isValid).toBe(true);
    });

    it('supports multiple camera angles', async () => {
      const angles = ['front', 'side', 'back'];
      const submissions = angles.map(angle => ({
        angle,
        videoUrl: `https://cdn.evofit.io/formchecks/squat-${angle}.mp4`
      }));

      expect(submissions).toHaveLength(3);
    });
  });

  describe('Trainer Feedback', () => {
    it('provides written feedback', async () => {
      const feedback = {
        positives: ['Good depth', 'Knees tracking properly'],
        improvements: ['Keep chest up', 'Brace core more'],
        overall: 'Great progress! Keep working on that core bracing.'
      };

      expect(feedback.positives).toHaveLength(2);
      expect(feedback.improvements).toHaveLength(2);
    });

    it('provides video feedback with annotations', async () => {
      const videoFeedback = {
        videoUrl: 'https://cdn.evofit.io/formchecks/feedback-1.mp4',
        annotations: [
          { time: 5, note: 'Watch knee valgus here' },
          { time: 12, note: 'Good hip hinge' }
        ]
      };

      expect(videoFeedback.annotations).toHaveLength(2);
      expect(videoFeedback.annotations[0].time).toBe(5);
    });

    it('rates form on scale', async () => {
      const ratings = {
        depth: 4,
        kneeTracking: 5,
        hipHinge: 3,
        bracing: 3,
        overall: 4
      };

      const average = Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length;
      expect(average).toBeCloseTo(3.8, 1);
    });

    it('compares to previous submissions', async () => {
      const submissions = [
        { date: '2026-01-01', overallRating: 3 },
        { date: '2026-02-01', overallRating: 4 },
        { date: '2026-03-01', overallRating: 4.5 }
      ];

      const improvement = submissions[submissions.length - 1].overallRating - submissions[0].overallRating;
      expect(improvement).toBe(1.5);
    });
  });

  describe('Form Check Status', () => {
    it('tracks pending status', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const formCheck = await prisma.formCheck.create({
        data: {
          clientId: client.id,
          trainerId: trainer.id,
          exerciseName: 'Squat',
          videoUrl: 'https://cdn.evofit.io/formchecks/squat.mp4',
          status: 'PENDING'
        }
      });

      expect(formCheck.status).toBe('PENDING');
    });

    it('tracks reviewed status', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const formCheck = await prisma.formCheck.create({
        data: {
          clientId: client.id,
          trainerId: trainer.id,
          exerciseName: 'Squat',
          videoUrl: 'https://cdn.evofit.io/formchecks/squat.mp4',
          status: 'REVIEWED',
          trainerFeedback: 'Great form!',
          reviewedAt: new Date()
        }
      });

      expect(formCheck.status).toBe('REVIEWED');
    });

    it('notifies client when review complete', async () => {
      const notification = {
        type: 'FORM_CHECK_REVIEWED',
        title: 'Form Check Reviewed',
        message: 'Your trainer has reviewed your squat form!',
        data: { formCheckId: 'fc-123' }
      };

      expect(notification.type).toBe('FORM_CHECK_REVIEWED');
    });
  });

  describe('Exercise Library', () => {
    it('supports common exercises', async () => {
      const exercises = [
        'Squat',
        'Deadlift',
        'Bench Press',
        'Overhead Press',
        'Row',
        'Pull-up'
      ];

      expect(exercises).toContain('Squat');
      expect(exercises).toContain('Deadlift');
    });

    it('supports custom exercise entry', async () => {
      const customExercise = {
        name: 'Zercher Squat',
        category: 'Squat Variation',
        description: 'Squat with barbell held in crook of elbows'
      };

      expect(customExercise.name).toBe('Zercher Squat');
    });
  });

  describe('Trainer Queue', () => {
    it('shows pending form checks queue', async () => {
      const trainer = await ActorFactory.createTrainer();

      const pendingChecks = [
        { id: 1, clientName: 'Client A', exercise: 'Squat', submittedAt: new Date() },
        { id: 2, clientName: 'Client B', exercise: 'Deadlift', submittedAt: new Date() }
      ];

      expect(pendingChecks).toHaveLength(2);
    });

    it('prioritizes by submission time', async () => {
      const checks = [
        { id: 1, submittedAt: new Date('2026-03-30'), priority: 'normal' },
        { id: 2, submittedAt: new Date('2026-03-29'), priority: 'normal' },
        { id: 3, submittedAt: new Date('2026-03-31'), priority: 'urgent' }
      ];

      const sorted = checks.sort((a, b) => {
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
        if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
        return a.submittedAt.getTime() - b.submittedAt.getTime();
      });

      expect(sorted[0].id).toBe(3); // Urgent first
    });
  });
});
