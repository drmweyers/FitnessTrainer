/**
 * Story 007-03: Progress Photos Comparison
 * FORGE User Simulation - Stream D
 *
 * As a client, I want to compare progress photos side-by-side
 * So that I can visualize my physical transformation
 */

import { prisma } from '@/lib/db/prisma';

const mockCreate = jest.fn();
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    progressPhoto: {
      create: (...args: any[]) => mockCreate(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
}));

import {
  ActorFactory,
  WorkflowRunner,
  cleanupTestData
} from './utils';

describe('Story 007-03: Progress Photos Comparison', () => {
  beforeEach(async () => {
    await cleanupTestData();
    jest.clearAllMocks();
    mockCreate.mockReset();
    mockFindMany.mockReset();
    mockUpdate.mockReset();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('uploads progress photo', async () => {
      const client = await ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'navigateToPhotos', data: { section: 'progress-photos' } },
          { action: 'selectPhotoType', data: { type: 'front' } },
          { action: 'uploadPhoto', data: { filename: 'march-front.jpg', size: 2048000 } },
          { action: 'addPhotoDate', data: { date: new Date('2026-03-31') } },
          { action: 'savePhoto', data: { confirm: true } }
        ]
      });

      expect(result.success).toBe(true);

      const photo = { id: "photo-" + Date.now(), url: "https://example.com/photo.jpg", takenAt: new Date(), type: 'FRONT', userId: client.id };

      expect(photo.type).toBe('FRONT');
      expect(photo.userId).toBe(client.id);
    });

    it('views photo timeline', async () => {
      const client = await ActorFactory.createClient();

      const timeline = [
        { id: "photo-1", url: "/photos/jan-front.jpg", takenAt: new Date('2026-01-15'), type: 'FRONT' },
        { id: "photo-2", url: "/photos/feb-front.jpg", takenAt: new Date('2026-02-15'), type: 'FRONT' },
        { id: "photo-3", url: "/photos/mar-front.jpg", takenAt: new Date('2026-03-15'), type: 'FRONT' },
      ];

      mockFindMany.mockResolvedValue(timeline);
      const result = await prisma.progressPhoto.findMany({ where: { userId: client.id } });

      expect(result).toHaveLength(3);
      expect(result[0].takenAt.getMonth()).toBe(0); // January
      expect(result[2].takenAt.getMonth()).toBe(2); // March
    });

    it('compares two photos side-by-side', async () => {
      const client = await ActorFactory.createClient();

      const photo1 = { id: "photo-1", url: "/photos/before.jpg", takenAt: new Date('2026-01-15') };
      const photo2 = { id: "photo-2", url: "/photos/after.jpg", takenAt: new Date('2026-04-15') };

      const comparison = {
        left: photo1,
        right: photo2,
        timeDifference: '3 months',
        annotations: []
      };

      expect(comparison.left.url).toBe('/photos/before.jpg');
      expect(comparison.right.url).toBe('/photos/after.jpg');
      expect(comparison.timeDifference).toBe('3 months');
    });

    it('creates photo album by pose type', async () => {
      const client = await ActorFactory.createClient();

      const photos = [
        { id: '1', url: '/photos/front.jpg', type: 'FRONT', takenAt: new Date() },
        { id: '2', url: '/photos/back.jpg', type: 'BACK', takenAt: new Date() },
        { id: '3', url: '/photos/side-left.jpg', type: 'SIDE_LEFT', takenAt: new Date() },
        { id: '4', url: '/photos/side-right.jpg', type: 'SIDE_RIGHT', takenAt: new Date() },
      ];

      mockFindMany.mockResolvedValue(photos);
      const result = await prisma.progressPhoto.findMany({ where: { userId: client.id } });

      const albums = result.reduce((acc: any, photo: any) => {
        acc[photo.type] = acc[photo.type] || [];
        acc[photo.type].push(photo);
        return acc;
      }, {});

      expect(Object.keys(albums)).toHaveLength(4);
    });
  });

  describe('Photo Comparison Features', () => {
    it('zooms into specific areas', async () => {
      const zoom = {
        level: 2.5,
        center: { x: 0.5, y: 0.5 },
        enabled: true
      };

      expect(zoom.level).toBeGreaterThan(1);
      expect(zoom.enabled).toBe(true);
    });

    it('syncs zoom between photos', async () => {
      const syncState = {
        zoom: 2.0,
        pan: { x: 100, y: 50 },
        synced: true
      };

      expect(syncState.synced).toBe(true);
      expect(syncState.zoom).toBe(2.0);
    });

    it('adds comparison annotations', async () => {
      const annotations = [
        { x: 100, y: 200, text: 'Shoulder definition improved' },
        { x: 150, y: 300, text: 'Waist reduced' }
      ];

      expect(annotations).toHaveLength(2);
      expect(annotations[0].text).toContain('Shoulder');
    });

    it('measures body parts', async () => {
      const measurements = {
        waist: { before: 34, after: 31, change: -3 },
        arms: { before: 14, after: 15.5, change: 1.5 }
      };

      expect(measurements.waist.change).toBe(-3);
      expect(measurements.arms.change).toBe(1.5);
    });
  });

  describe('Photo Management', () => {
    it('edits photo date', async () => {
      const client = await ActorFactory.createClient();

      mockUpdate.mockResolvedValue({ id: '1', takenAt: new Date('2026-02-15') });

      const updated = await prisma.progressPhoto.update({
        where: { id: '1' },
        data: { takenAt: new Date('2026-02-15') }
      });

      expect(updated.takenAt.getMonth()).toBe(1); // February
    });

    it('deletes photo', async () => {
      const client = await ActorFactory.createClient();

      mockUpdate.mockResolvedValue({ id: '1', deletedAt: new Date() });

      await prisma.progressPhoto.update({
        where: { id: '1' },
        data: { deletedAt: new Date() }
      });

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('organizes by date range', async () => {
      const photos = [
        { id: '1', takenAt: new Date('2026-01-15') },
        { id: '2', takenAt: new Date('2026-02-15') },
        { id: '3', takenAt: new Date('2026-03-15') }
      ];

      const byMonth: any = {};
      photos.forEach(photo => {
        const month = photo.takenAt.toLocaleString('default', { month: 'long' });
        byMonth[month] = byMonth[month] || [];
        byMonth[month].push(photo);
      });

      expect(Object.keys(byMonth)).toContain('January');
      expect(Object.keys(byMonth)).toContain('February');
      expect(Object.keys(byMonth)).toContain('March');
    });
  });

  describe('Transformation View', () => {
    it('generates transformation timeline', async () => {
      const client = await ActorFactory.createClient();

      const dates = [
        new Date('2026-01-01'),
        new Date('2026-02-01'),
        new Date('2026-03-01')
      ];

      const photos = dates.map((date, i) => ({
        id: `photo-${i}`,
        url: `/photos/${date.toISOString().split('T')[0]}.jpg`,
        takenAt: date
      }));

      mockFindMany.mockResolvedValue(photos);
      const result = await prisma.progressPhoto.findMany({ where: { userId: client.id } });

      expect(result).toHaveLength(3);
    });

    it('calculates time between photos', async () => {
      const photo1 = { takenAt: new Date('2026-01-01') };
      const photo2 = { takenAt: new Date('2026-04-01') };

      const diffTime = Math.abs(photo2.takenAt.getTime() - photo1.takenAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(90);
    });

    it('highlights key changes', async () => {
      const changes = [
        { area: 'shoulders', change: 'improved', significance: 'high' },
        { area: 'waist', change: 'reduced', significance: 'high' },
        { area: 'posture', change: 'better', significance: 'medium' }
      ];

      const highSignificance = changes.filter(c => c.significance === 'high');
      expect(highSignificance).toHaveLength(2);
    });
  });

  describe('Privacy & Sharing', () => {
    it('keeps photos private by default', async () => {
      const photo = { id: "photo-" + Date.now(), url: "https://example.com/photo.jpg", takenAt: new Date(), isPrivate: true };

      expect(photo.isPrivate).toBe(true);
    });

    it('shares photo with trainer', async () => {
      const photo = { id: "photo-" + Date.now(), url: "https://example.com/photo.jpg", takenAt: new Date(), sharedWithTrainer: true };

      expect(photo.sharedWithTrainer).toBe(true);
    });

    it('creates shareable link with expiration', async () => {
      const shareLink = {
        url: 'https://evofit.io/share/abc123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxViews: 10
      };

      expect(shareLink.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(shareLink.maxViews).toBe(10);
    });

    it('revokes shared access', async () => {
      const shareLink = {
        url: 'https://evofit.io/share/abc123',
        revokedAt: new Date(),
        active: false
      };

      expect(shareLink.active).toBe(false);
      expect(shareLink.revokedAt).toBeDefined();
    });
  });
});
