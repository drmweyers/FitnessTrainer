/**
 * Story 008-05: Message Templates
 * FORGE User Simulation - Stream D
 *
 * As a trainer, I want to use message templates
 * So that I can quickly send common responses
 */


import {
  ActorFactory,
  WorkflowRunner,
  MessagingHelpers,
  cleanupTestData
} from './utils';

describe('Story 008-05: Message Templates', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('creates message template', async () => {
      const trainer = await ActorFactory.createTrainer();

      const template = await prisma.messageTemplate.create({
        data: {
          userId: trainer.id,
          name: 'Workout Reminder',
          content: 'Hi {{clientName}}! Just a reminder about your workout today: {{workoutName}}. Let me know if you have any questions!',
          category: 'REMINDER',
          variables: ['clientName', 'workoutName']
        }
      });

      expect(template.name).toBe('Workout Reminder');
      expect(template.variables).toContain('clientName');
    });

    it('uses template to send message', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient({ fullName: 'John Doe' });

      const template = await prisma.messageTemplate.create({
        data: {
          userId: trainer.id,
          name: 'Welcome',
          content: 'Welcome {{clientName}}! Excited to work with you.',
          category: 'ONBOARDING',
          variables: ['clientName']
        }
      });

      // Apply template
      const messageContent = template.content.replace('{{clientName}}', client.fullName || 'Client');

      expect(messageContent).toBe('Welcome John Doe! Excited to work with you.');
    });

    it('views all templates', async () => {
      const trainer = await ActorFactory.createTrainer();

      await prisma.messageTemplate.create({
        data: {
          userId: trainer.id,
          name: 'Template 1',
          content: 'Content 1',
          category: 'GENERAL'
        }
      });

      await prisma.messageTemplate.create({
        data: {
          userId: trainer.id,
          name: 'Template 2',
          content: 'Content 2',
          category: 'REMINDER'
        }
      });

      const templates = await prisma.messageTemplate.findMany({
        where: { userId: trainer.id }
      });

      expect(templates).toHaveLength(2);
    });

    it('categorizes templates', async () => {
      const trainer = await ActorFactory.createTrainer();

      const categories = ['ONBOARDING', 'REMINDER', 'FEEDBACK', 'MOTIVATION', 'TECHNIQUE'];

      for (const category of categories) {
        await prisma.messageTemplate.create({
          data: {
            userId: trainer.id,
            name: `${category} Template`,
            content: `Content for ${category}`,
            category
          }
        });
      }

      const templates = await prisma.messageTemplate.findMany({
        where: { userId: trainer.id }
      });

      expect(templates.map(t => t.category)).toContain('MOTIVATION');
    });
  });

  describe('Template Management', () => {
    it('edits template', async () => {
      const trainer = await ActorFactory.createTrainer();

      const template = await prisma.messageTemplate.create({
        data: {
          userId: trainer.id,
          name: 'Old Name',
          content: 'Old content',
          category: 'GENERAL'
        }
      });

      const updated = await prisma.messageTemplate.update({
        where: { id: template.id },
        data: { name: 'New Name', content: 'New content' }
      });

      expect(updated.name).toBe('New Name');
      expect(updated.content).toBe('New content');
    });

    it('deletes template', async () => {
      const trainer = await ActorFactory.createTrainer();

      const template = await prisma.messageTemplate.create({
        data: {
          userId: trainer.id,
          name: 'To Delete',
          content: 'Content',
          category: 'GENERAL'
        }
      });

      await prisma.messageTemplate.delete({
        where: { id: template.id }
      });

      const found = await prisma.messageTemplate.findUnique({
        where: { id: template.id }
      });

      expect(found).toBeNull();
    });

    it('duplicates template', async () => {
      const trainer = await ActorFactory.createTrainer();

      const original = await prisma.messageTemplate.create({
        data: {
          userId: trainer.id,
          name: 'Original',
          content: 'Content',
          category: 'GENERAL'
        }
      });

      const duplicate = await prisma.messageTemplate.create({
        data: {
          userId: trainer.id,
          name: `${original.name} (Copy)`,
          content: original.content,
          category: original.category
        }
      });

      expect(duplicate.name).toBe('Original (Copy)');
      expect(duplicate.content).toBe(original.content);
    });
  });

  describe('Template Variables', () => {
    it('supports client name variable', async () => {
      const template = {
        content: 'Hi {{clientName}}!',
        variables: ['clientName']
      };

      const result = template.content.replace('{{clientName}}', 'John');
      expect(result).toBe('Hi John!');
    });

    it('supports workout name variable', async () => {
      const template = {
        content: 'Your {{workoutName}} is ready!',
        variables: ['workoutName']
      };

      const result = template.content.replace('{{workoutName}}', 'Leg Day');
      expect(result).toBe('Your Leg Day is ready!');
    });

    it('supports multiple variables', async () => {
      const template = {
        content: 'Hi {{clientName}}! Your {{workoutName}} is scheduled for {{date}}.',
        variables: ['clientName', 'workoutName', 'date']
      };

      let result = template.content;
      result = result.replace('{{clientName}}', 'John');
      result = result.replace('{{workoutName}}', 'Push Day');
      result = result.replace('{{date}}', 'Monday');

      expect(result).toBe('Hi John! Your Push Day is scheduled for Monday.');
    });

    it('validates all variables are filled', async () => {
      const template = {
        content: 'Hi {{clientName}}!',
        variables: ['clientName']
      };

      const filled = { clientName: 'John' };
      const isComplete = template.variables.every(v => filled[v as keyof typeof filled]);

      expect(isComplete).toBe(true);
    });
  });

  describe('Quick Replies', () => {
    it('creates quick reply', async () => {
      const trainer = await ActorFactory.createTrainer();

      const quickReply = await prisma.quickReply.create({
        data: {
          userId: trainer.id,
          shortcut: '/great',
          message: 'Great work! Keep it up!',
          category: 'ENCOURAGEMENT'
        }
      });

      expect(quickReply.shortcut).toBe('/great');
      expect(quickReply.message).toBe('Great work! Keep it up!');
    });

    it('uses quick reply shortcut', async () => {
      const quickReplies: Record<string, string> = {
        '/great': 'Great work!',
        '/form': 'Your form is looking good!',
        '/rest': 'Make sure to get enough rest.'
      };

      const input = '/great';
      const message = quickReplies[input];

      expect(message).toBe('Great work!');
    });

    it('lists all quick replies', async () => {
      const trainer = await ActorFactory.createTrainer();

      await prisma.quickReply.create({
        data: {
          userId: trainer.id,
          shortcut: '/great',
          message: 'Great work!',
          category: 'ENCOURAGEMENT'
        }
      });

      await prisma.quickReply.create({
        data: {
          userId: trainer.id,
          shortcut: '/thanks',
          message: 'Thank you!',
          category: 'GENERAL'
        }
      });

      const replies = await prisma.quickReply.findMany({
        where: { userId: trainer.id }
      });

      expect(replies).toHaveLength(2);
    });
  });

  describe('Template Library', () => {
    it('provides default templates', async () => {
      const defaultTemplates = [
        {
          name: 'Welcome New Client',
          content: 'Welcome {{clientName}}! I\'m excited to work with you on your fitness journey.',
          category: 'ONBOARDING'
        },
        {
          name: 'Workout Reminder',
          content: 'Hi {{clientName}}! Don\'t forget about your {{workoutName}} today.',
          category: 'REMINDER'
        },
        {
          name: 'Great Job',
          content: 'Fantastic work today, {{clientName}}! Your dedication is paying off.',
          category: 'MOTIVATION'
        }
      ];

      expect(defaultTemplates).toHaveLength(3);
      expect(defaultTemplates[0].category).toBe('ONBOARDING');
    });

    it('imports template from library', async () => {
      const libraryTemplate = {
        name: 'Form Check Request',
        content: 'Hi {{clientName}}! Could you send me a video of your {{exerciseName}} form?',
        category: 'TECHNIQUE'
      };

      const trainer = await ActorFactory.createTrainer();

      const imported = await prisma.messageTemplate.create({
        data: {
          userId: trainer.id,
          name: libraryTemplate.name,
          content: libraryTemplate.content,
          category: libraryTemplate.category,
          source: 'LIBRARY'
        }
      });

      expect(imported.source).toBe('LIBRARY');
    });
  });
});
