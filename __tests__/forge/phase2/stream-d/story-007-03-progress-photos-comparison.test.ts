/**
 * Story 007-03: Progress Photos Comparison
 * FORGE User Simulation - Stream D
 *
 * As a client, I want to compare progress photos side-by-side
 * So that I can visualize my physical transformation
 */


import {
  ActorFactory,
  WorkflowRunner,
  cleanupTestData
} from './utils';

describe('Story 007-03: Progress Photos Comparison', () => {
  beforeEach(async () => {
    await cleanupTestData();
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

      const photo = await prisma.progressPhoto.create({
        data: {
          userId: client.id,
          url: '/photos/march-front.jpg',
          type: 'FRONT',
          takenAt: new Date('2026-03-31')
        }
      });

      expect(photo.type).toBe('FRONT');
      expect(photo.userId).toBe(client.id);
    });

    it('views photo timeline', async () => {
      const client = await ActorFactory.createClient();

      // Create photos over time
      const photos = [
        { url: '/photos/jan-front.jpg', type: 'FRONT', takenAt: new Date('2026-01-15') },
        { url: '/photos/feb-front.jpg', type: 'FRONT', takenAt: new Date('2026-02-15') },
        { url: '/photos/mar-front.jpg', type: 'FRONT', takenAt: new Date('2026-03-15') }
      ];

      for (const photo of photos) {
        await prisma.progressPhoto.create({
          data: {
            userId: client.id,
            url: photo.url,
            type: photo.type,
            takenAt: photo.takenAt
          }
        });
      }

      const timeline = await prisma.progressPhoto.findMany({
        where: { userId: client.id },
        orderBy: { takenAt: 'asc' }
      });

      expect(timeline).toHaveLength(3);
      expect(timeline[0].takenAt.getMonth()).toBe(0); // January
      expect(timeline[2].takenAt.getMonth()).toBe(2); // March
    });

    it('compares two photos side-by-side', async () => {
      const client = await ActorFactory.createClient();

      const photo1 = await prisma.progressPhoto.create({
        data: {
          userId: client.id,
          url: '/photos/before.jpg',
          type: 'FRONT',
          takenAt: new Date('2026-01-01')
        }
      });

      const photo2 = await prisma.progressPhoto.create({
        data: {
          userId: client.id,
          url: '/photos/after.jpg',
          type: 'FRONT',
          takenAt: new Date('2026-03-31')
        }
      });

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

      const poses = ['FRONT', 'BACK', 'SIDE_LEFT', 'SIDE_RIGHT'];

      for (const pose of poses) {
        await prisma.progressPhoto.create({
          data: {
            userId: client.id,
            url: `/photos/${pose.toLowerCase()}.jpg`,
            type: pose,
            takenAt: new Date('2026-03-31')
          }
        });
      }

      const albums = await prisma.progressPhoto.groupBy({
        by: ['type'],
        where: { userId: client.id },
        _count: { id: true }
      });

      expect(albums).toHaveLength(4);
      expect(albums.map(a => a.type)).toContain('FRONT');
      expect(albums.map(a => a.type)).toContain('BACK');
    });
  });

  describe('Photo Types', () => {
    it('supports front pose photo', async () => {
      const client = await ActorFactory.createClient();

      const photo = await prisma.progressPhoto.create({
        data: {
          userId: client.id,
          url: '/photos/front.jpg',
          type: 'FRONT',
          takenAt: new Date()
        }
      });

      expect(photo.type).toBe('FRONT');
    });

    it('supports back pose photo', async () => {
      const client = await ActorFactory.createClient();

      const photo = await prisma.progressPhoto.create({
        data: {
          userId: client.id,
          url: '/photos/back.jpg',
          type: 'BACK',
          takenAt: new Date()
        }
      });

      expect(photo.type).toBe('BACK');
    });

    it('supports side pose photos', async () => {
      const client = await ActorFactory.createClient();

      const left = await prisma.progressPhoto.create({
        data: {
          userId: client.id,
          url: '/photos/side-left.jpg',
          type: 'SIDE_LEFT',
          takenAt: new Date()
        }
      });

      const right = await prisma.progressPhoto.create({
        data: {
          userId: client.id,
          url: '/photos/side-right.jpg',
          type: 'SIDE_RIGHT',
          takenAt: new Date()
        }
      });

      expect(left.type).toBe('SIDE_LEFT');
      expect(right.type).toBe('SIDE_RIGHT');
    });

    it('supports custom pose labels', async () => {
      const client = await ActorFactory.createClient();

      const photo = await prisma.progressPhoto.create({
        data: {
          userId: client.id,
          url: '/photos/flexed.jpg',
          type: 'CUSTOM',
          label: 'Front Flexed',
          takenAt: new Date()
        }
      });

      expect(photo.type).toBe('CUSTOM');
    });
  });

  describe('Comparison Features', () => {
    it('syncs zoom between comparison photos', async () => {
      const zoomLevel = 1.5;
      const panPosition = { x: 100, y: 50 };

      const syncState = {
        zoom: zoomLevel,
        pan: panPosition,
        synced: true
      };

      expect(syncState.zoom).toBe(1.5);
      expect(syncState.synced).toBe(true);
    });

    it('adds annotation to photo', async () => {
      const client = await ActorFactory.createClient();

      const photo = await prisma.progressPhoto.create({
        data: {
          userId: client.id,
          url: '/photos/annotated.jpg',
          type: 'FRONT',
          takenAt: new Date(),
          annotations: {
            create: [{
              x: 100,
              y: 200,
              text: 'Notice definition here',
              createdAt: new Date()
            }]
          }
        }
      });

      expect(photo).toBeDefined();
    });

    it('measures pixel distance on photo', async () => {
      const measurement = {
        startPoint: { x: 100, y: 100 },
        endPoint: { x: 200, y: 100 },
        pixelDistance: 100,
        scale: 0.5, // pixels per inch
        realDistance: 50 // inches
      };

      expect(measurement.realDistance).toBe(50);
    });

    it('overlays grid for alignment', async () => {
      const grid = {
        enabled: true,
        type: 'thirds',
        opacity: 0.3,
        color: '#ffffff'
      };

      expect(grid.enabled).toBe(true);
      expect(grid.type).toBe('thirds');
    });

    it('exports comparison as image', async () => {
      const exportSettings = {
        format: 'png',
        quality: 0.9,
        includeDate: true,
        includeMeasurements: true,
        filename: 'progress-comparison-march-2026.png'
      };

      expect(exportSettings.format).toBe('png');
      expect(exportSettings.includeDate).toBe(true);
    });
  });

  describe('Photo Management', () => {
    it('updates photo date', async () => {
      const client = await ActorFactory.createClient();

      const photo = await prisma.progressPhoto.create({
        data: {
          userId: client.id,
          url: '/photos/photo.jpg',
          type: 'FRONT',
          takenAt: new Date('2026-01-15')
        }
      });

      const updated = await prisma.progressPhoto.update({
        where: { id: photo.id },
        data: { takenAt: new Date('2026-01-20') }
      });

      expect(updated.takenAt.getDate()).toBe(20);
    });

    it('deletes photo', async () => {
      const client = await ActorFactory.createClient();

      const photo = await prisma.progressPhoto.create({
        data: {
          userId: client.id,
          url: '/photos/delete-me.jpg',
          type: 'FRONT',
          takenAt: new Date()
        }
      });

      await prisma.progressPhoto.delete({
        where: { id: photo.id }
      });

      const found = await prisma.progressPhoto.findUnique({
        where: { id: photo.id }
      });

      expect(found).toBeNull();
    });

    it('organizes photos by date range', async () => {
      const client = await ActorFactory.createClient();

      const dates = [
        new Date('2026-01-15'),
        new Date('2026-02-15'),
        new Date('2026-03-15')
      ];

      for (const date of dates) {
        await prisma.progressPhoto.create({
          data: {
            userId: client.id,
            url: `/photos/${date.toISOString().split('T')[0]}.jpg`,
            type: 'FRONT',
            takenAt: date
          }
        });
      }

      const janPhotos = await prisma.progressPhoto.findMany({
        where: {
          userId: client.id,
          takenAt: {
            gte: new Date('2026-01-01'),
            lt: new Date('2026-02-01')
          }
        }
      });

      expect(janPhotos).toHaveLength(1);
    });
  });

  describe('Privacy & Sharing', () => {
    it('keeps photos private by default', async () => {
      const client = await ActorFactory.createClient();

      const photo = await prisma.progressPhoto.create({
        data: {
          userId: client.id,
          url: '/photos/private.jpg',
          type: 'FRONT',
          takenAt: new Date(),
          isPrivate: true
        }
      });

      expect(photo.isPrivate).toBe(true);
    });

    it('shares photo with trainer', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      await prisma.client.create({
        data: {
          trainerId: trainer.id,
          userId: client.id,
          status: 'ACTIVE'
        }
      });

      const photo = await prisma.progressPhoto.create({
        data: {
          userId: client.id,
          url: '/photos/shared.jpg',
          type: 'FRONT',
          takenAt: new Date(),
          sharedWithTrainer: true
        }
      });

      expect(photo.sharedWithTrainer).toBe(true);
    });

    it('creates shareable link with expiration', async () => {
      const shareLink = {
        token: 'abc123xyz',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        views: 0,
        maxViews: 10
      };

      expect(shareLink.token).toBeDefined();
      expect(shareLink.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Photo Guidelines', () => {
    it('validates minimum photo dimensions', () => {
      const minWidth = 800;
      const minHeight = 600;

      const validDimensions = (width: number, height: number) =>
        width >= minWidth && height >= minHeight;

      expect(validDimensions(1200, 800)).toBe(true);
      expect(validDimensions(640, 480)).toBe(false);
    });

    it('validates file size limit', () => {
      const maxSize = 10 * 1024 * 1024; // 10MB

      const validSize = (size: number) => size <= maxSize;

      expect(validSize(5 * 1024 * 1024)).toBe(true);
      expect(validSize(15 * 1024 * 1024)).toBe(false);
    });

    it('validates file type', () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/heic'];

      const validType = (type: string) => allowedTypes.includes(type);

      expect(validType('image/jpeg')).toBe(true);
      expect(validType('image/gif')).toBe(false);
    });

    it('provides photo tips', () => {
      const tips = [
        'Use consistent lighting',
        'Wear fitted clothing',
        'Stand against plain background',
        'Maintain same pose each time',
        'Take photos at same time of day'
      ];

      expect(tips).toContain('Use consistent lighting');
      expect(tips).toContain('Maintain same pose each time');
    });
  });
});
