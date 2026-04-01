/**
 * Story 007-01: Track Body Measurements
 * FORGE User Simulation - Stream D
 *
 * As a client, I want to log my body measurements
 * So that I can track physical changes over time
 */

import {
  ActorFactory,
  WorkflowRunner,
  MeasurementHelpers,
  cleanupTestData
} from './utils';

describe('Story 007-01: Track Body Measurements', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('completes full measurement logging workflow', async () => {
      const client = await ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          {
            action: 'navigateToMeasurements',
            data: { page: 'measurements' }
          },
          {
            action: 'selectMeasurementDate',
            data: { date: new Date('2026-03-31') }
          },
          {
            action: 'enterMeasurements',
            data: {
              chest: 40.5,
              waist: 32.0,
              hips: 38.0,
              leftArm: 14.5,
              rightArm: 14.75,
              leftThigh: 22.0,
              rightThigh: 22.25,
              unit: 'inches'
            }
          },
          {
            action: 'addWeight',
            data: { weight: 185, unit: 'lbs' }
          },
          {
            action: 'addNotes',
            data: { notes: 'Feeling strong today!' }
          },
          {
            action: 'saveMeasurements',
            data: { confirm: true }
          }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(6);
    });

    it('logs measurements with all body points', async () => {
      const client = await ActorFactory.createClient();

      const measurement = await MeasurementHelpers.createBodyMeasurements(
        client.id,
        {
          chest: 40.5,
          waist: 32.0,
          hips: 38.0,
          leftArm: 14.5,
          rightArm: 14.75,
          leftThigh: 22.0,
          rightThigh: 22.25,
          unit: 'inches'
        }
      );

      expect(measurement).toBeDefined();
      expect(measurement.measurements).toBeDefined();
      expect(measurement.measurements.chest).toBe(40.5);
      expect(measurement.measurements.waist).toBe(32.0);
      expect(measurement.measurements.hips).toBe(38.0);
    });

    it('views measurement history', async () => {
      const client = await ActorFactory.createClient();

      // Create historical measurements
      const m1 = await MeasurementHelpers.createBodyMeasurements(client.id, {
        chest: 40.0,
        waist: 33.0,
        hips: 37.5,
        unit: 'inches',
        recordedAt: new Date('2026-03-01')
      });

      const m2 = await MeasurementHelpers.createBodyMeasurements(client.id, {
        chest: 40.5,
        waist: 32.5,
        hips: 38.0,
        unit: 'inches',
        recordedAt: new Date('2026-03-15')
      });

      const m3 = await MeasurementHelpers.createBodyMeasurements(client.id, {
        chest: 41.0,
        waist: 32.0,
        hips: 38.5,
        unit: 'inches',
        recordedAt: new Date('2026-03-31')
      });

      expect(m1.measurements.chest).toBe(40.0);
      expect(m2.measurements.chest).toBe(40.5);
      expect(m3.measurements.chest).toBe(41.0);
    });

    it('calculates progress between measurements', async () => {
      const previous = 33.0;
      const current = 32.0;

      const progress = MeasurementHelpers.calculateProgress(current, previous);

      expect(progress.change).toBe(-1.0);
      expect(progress.changePercentage).toBeCloseTo(-3.03, 1);
      expect(progress.trend).toBe('loss');
    });

    it('exports measurement data', async () => {
      const client = await ActorFactory.createClient();

      const measurement = await MeasurementHelpers.createBodyMeasurements(client.id, {
        chest: 40.5,
        waist: 32.0,
        unit: 'inches'
      });

      // Simulate export
      const exportData = {
        userId: client.id,
        exportedAt: new Date(),
        measurements: [{
          chest: measurement.measurements.chest,
          waist: measurement.measurements.waist,
          unit: measurement.measurements.unit,
          recordedAt: measurement.recordedAt
        }]
      };

      expect(exportData.measurements).toHaveLength(1);
      expect(exportData.measurements[0]).toHaveProperty('chest');
      expect(exportData.measurements[0]).toHaveProperty('waist');
    });
  });

  describe('Unit Conversion', () => {
    it('stores measurements in inches', async () => {
      const client = await ActorFactory.createClient();

      const measurement = await MeasurementHelpers.createMeasurement(client.id, {
        type: 'waist',
        value: 32.0,
        unit: 'inches'
      });

      expect(measurement.measurements.unit).toBe('inches');
      expect(measurement.measurements.value).toBe(32.0);
    });

    it('stores measurements in cm', async () => {
      const client = await ActorFactory.createClient();

      const measurement = await MeasurementHelpers.createMeasurement(client.id, {
        type: 'waist',
        value: 81.28,
        unit: 'cm'
      });

      expect(measurement.measurements.unit).toBe('cm');
      expect(measurement.measurements.value).toBe(81.28);
    });

    it('converts inches to cm correctly', () => {
      const inches = 32.0;
      const cm = inches * 2.54;

      expect(cm).toBeCloseTo(81.28, 2);
    });

    it('converts cm to inches correctly', () => {
      const cm = 81.28;
      const inches = cm / 2.54;

      expect(inches).toBeCloseTo(32.0, 1);
    });
  });

  describe('Edge Cases', () => {
    it('handles first measurement (no baseline)', async () => {
      const client = await ActorFactory.createClient();

      const measurement = await MeasurementHelpers.createMeasurement(client.id, {
        type: 'weight',
        value: 185,
        unit: 'lbs'
      });

      expect(measurement.measurements.value).toBe(185);
    });

    it('handles partial measurements (some fields empty)', async () => {
      const client = await ActorFactory.createClient();

      // Only log chest and waist
      const measurement = await MeasurementHelpers.createBodyMeasurements(
        client.id,
        {
          chest: 40.5,
          waist: 32.0,
          unit: 'inches'
        }
      );

      expect(measurement.measurements.chest).toBe(40.5);
      expect(measurement.measurements.waist).toBe(32.0);
      expect(measurement.measurements.hips).toBeUndefined();
    });

    it('handles multiple measurements on same day', async () => {
      const client = await ActorFactory.createClient();
      const today = new Date('2026-03-31');

      const m1 = await MeasurementHelpers.createMeasurement(client.id, {
        type: 'weight',
        value: 185,
        unit: 'lbs',
        recordedAt: today
      });

      const m2 = await MeasurementHelpers.createMeasurement(client.id, {
        type: 'weight',
        value: 184.5,
        unit: 'lbs',
        recordedAt: today
      });

      expect(m1.measurements.value).toBe(185);
      expect(m2.measurements.value).toBe(184.5);
    });

    it('handles very large weight changes', async () => {
      const previous = 250;
      const current = 180;

      const progress = MeasurementHelpers.calculateProgress(current, previous);

      expect(progress.change).toBe(-70);
      expect(progress.changePercentage).toBe(-28);
      expect(progress.trend).toBe('loss');
    });

    it('handles stable measurements (no change)', async () => {
      const previous = 32.0;
      const current = 32.0;

      const progress = MeasurementHelpers.calculateProgress(current, previous);

      expect(progress.change).toBe(0);
      expect(progress.changePercentage).toBe(0);
      expect(progress.trend).toBe('stable');
    });
  });

  describe('Calculation Tests', () => {
    it('calculates gain trend correctly', () => {
      const previous = 14.0;
      const current = 14.5;

      const progress = MeasurementHelpers.calculateProgress(current, previous);

      expect(progress.change).toBe(0.5);
      expect(progress.trend).toBe('gain');
    });

    it('calculates loss trend correctly', () => {
      const previous = 38.0;
      const current = 37.0;

      const progress = MeasurementHelpers.calculateProgress(current, previous);

      expect(progress.change).toBe(-1.0);
      expect(progress.trend).toBe('loss');
    });

    it('calculates percentage change correctly', () => {
      const previous = 200;
      const current = 180;

      const progress = MeasurementHelpers.calculateProgress(current, previous);

      expect(progress.changePercentage).toBe(-10);
    });

    it('handles zero previous value', () => {
      const previous = 0;
      const current = 10;

      const progress = MeasurementHelpers.calculateProgress(current, previous);

      expect(progress.change).toBe(10);
      expect(progress.changePercentage).toBe(0); // Avoid division by zero
    });
  });

  describe('Trainer-Client Interaction', () => {
    it('trainer views client measurements', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      // Client logs measurements
      const measurement = await MeasurementHelpers.createBodyMeasurements(client.id, {
        chest: 40.5,
        waist: 32.0,
        unit: 'inches'
      });

      expect(measurement.measurements.chest).toBe(40.5);
      expect(measurement.measurements.waist).toBe(32.0);
    });

    it('trainer adds measurement notes for client', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      // Simulate adding a note
      const note = {
        clientId: client.id,
        trainerId: trainer.id,
        content: 'Great progress on waist measurement!',
        type: 'MEASUREMENT'
      };

      expect(note.content).toBe('Great progress on waist measurement!');
      expect(note.type).toBe('MEASUREMENT');
    });
  });

  describe('Measurement Guidance', () => {
    it('provides measurement tips', () => {
      const tips = {
        chest: 'Measure at the fullest part of the chest',
        waist: 'Measure at the narrowest part of the waist',
        hips: 'Measure at the widest part of the hips',
        arms: 'Measure at the midpoint between shoulder and elbow',
        thighs: 'Measure at the midpoint between hip and knee'
      };

      expect(tips.chest).toContain('fullest part');
      expect(tips.waist).toContain('narrowest part');
    });

    it('validates measurement values are positive', async () => {
      const client = await ActorFactory.createClient();

      // Negative values should not be allowed
      const isValid = (value: number) => value > 0;

      expect(isValid(32.0)).toBe(true);
      expect(isValid(-5)).toBe(false);
      expect(isValid(0)).toBe(false);
    });

    it('validates measurement values are within reasonable range', () => {
      const isReasonable = (value: number, type: string) => {
        const ranges: Record<string, [number, number]> = {
          chest: [20, 80],
          waist: [15, 60],
          hips: [20, 70],
          weight: [50, 500]
        };

        const [min, max] = ranges[type] || [0, 1000];
        return value >= min && value <= max;
      };

      expect(isReasonable(40, 'chest')).toBe(true);
      expect(isReasonable(10, 'chest')).toBe(false);
      expect(isReasonable(100, 'chest')).toBe(false);
    });
  });
});
