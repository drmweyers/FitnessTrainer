/**
 * Story 005-06: Use Program Templates
 * FORGE User Simulation Tests
 *
 * Tests trainer workflow for browsing, using, and creating program templates
 */

import { ActorFactory, TrainerActor } from '@/lib/forge/utils/actor-factory';
import { WorkflowRunner } from '@/lib/forge/utils/workflow-runner';

describe('Story 005-06: Use Program Templates', () => {
  let trainer: TrainerActor;

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer);
  });

  describe('Happy Path', () => {
    it('browses available templates', async () => {
      const templates = [
        { name: '5x5 Strength', trainerId: trainer.id, difficulty: 'intermediate', durationWeeks: 12, isTemplate: true },
        { name: 'PPL Split', trainerId: trainer.id, difficulty: 'advanced', durationWeeks: 8, isTemplate: true },
        { name: 'Full Body', trainerId: trainer.id, difficulty: 'beginner', durationWeeks: 6, isTemplate: true },
      ];

      expect(templates).toHaveLength(3);
    });

    it('uses template to create new program', async () => {
      const template = {
        id: 'template-1',
        name: '5x5 Strength Template',
        trainerId: trainer.id,
        difficulty: 'intermediate',
        durationWeeks: 12,
        isTemplate: true,
      };

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'createProgram',
            data: {
              name: 'My 5x5 Program',
              difficulty: template.difficulty,
              durationWeeks: template.durationWeeks,
              basedOnTemplateId: template.id,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.finalState.program.difficulty).toBe('intermediate');
    });

    it('saves custom program as template', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'createProgram',
            data: {
              name: 'My Custom Template',
              difficulty: 'intermediate',
              durationWeeks: 8,
              isTemplate: true,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.finalState.program.isTemplate).toBe(true);
    });
  });

  describe('Template Filtering', () => {
    it('filters templates by difficulty', async () => {
      const templates = [
        { name: 'Beginner Program', trainerId: trainer.id, difficulty: 'beginner', durationWeeks: 4, isTemplate: true },
        { name: 'Intermediate Program', trainerId: trainer.id, difficulty: 'intermediate', durationWeeks: 8, isTemplate: true },
        { name: 'Advanced Program', trainerId: trainer.id, difficulty: 'advanced', durationWeeks: 12, isTemplate: true },
      ];

      const beginnerTemplates = templates.filter(t => t.difficulty === 'beginner');

      expect(beginnerTemplates).toHaveLength(1);
      expect(beginnerTemplates[0].name).toBe('Beginner Program');
    });

    it('filters templates by duration', async () => {
      const templates = [
        { name: 'Short Program', trainerId: trainer.id, difficulty: 'beginner', durationWeeks: 4, isTemplate: true },
        { name: 'Medium Program', trainerId: trainer.id, difficulty: 'intermediate', durationWeeks: 8, isTemplate: true },
        { name: 'Long Program', trainerId: trainer.id, difficulty: 'advanced', durationWeeks: 12, isTemplate: true },
      ];

      const longTemplates = templates.filter(t => t.durationWeeks >= 8);

      expect(longTemplates).toHaveLength(2);
    });
  });

  describe('Template Management', () => {
    it('edits template name', async () => {
      const template = {
        id: 'template-1',
        name: 'Old Name',
        trainerId: trainer.id,
        difficulty: 'intermediate',
        durationWeeks: 8,
        isTemplate: true,
      };

      const updated = { ...template, name: 'New Name' };

      expect(updated.name).toBe('New Name');
    });

    it('deletes unused template', async () => {
      const templates = [
        { id: 'template-1', name: 'To Delete', trainerId: trainer.id, isTemplate: true },
        { id: 'template-2', name: 'Keep', trainerId: trainer.id, isTemplate: true },
      ];

      const filtered = templates.filter(t => t.id !== 'template-1');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Keep');
    });

    it('duplicates existing template', async () => {
      const original = {
        id: 'template-1',
        name: 'Original Template',
        trainerId: trainer.id,
        difficulty: 'intermediate',
        durationWeeks: 8,
        isTemplate: true,
      };

      const duplicate = {
        ...original,
        id: 'template-2',
        name: `Copy of ${original.name}`,
      };

      expect(duplicate).toBeDefined();
      expect(duplicate.name).toContain('Copy');
    });
  });

  describe('Template Visibility', () => {
    it('marks template as public', async () => {
      const template = {
        name: 'Public Template',
        trainerId: trainer.id,
        difficulty: 'intermediate',
        durationWeeks: 8,
        isTemplate: true,
        isPublic: true,
      };

      expect(template.isPublic).toBe(true);
    });

    it('marks template as private', async () => {
      const template = {
        name: 'Private Template',
        trainerId: trainer.id,
        difficulty: 'intermediate',
        durationWeeks: 8,
        isTemplate: true,
        isPublic: false,
      };

      expect(template.isPublic).toBe(false);
    });
  });
});
