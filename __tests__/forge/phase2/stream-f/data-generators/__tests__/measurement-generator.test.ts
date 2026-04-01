import { generateMeasurementSeries, generateRecoveryMetrics } from '../measurement-generator';

describe('Measurement Generator', () => {
  it('should generate 3 measurement records over 14 days', () => {
    const measurements = generateMeasurementSeries({
      startWeight: 180,
      startBodyFat: 18,
      measurementDays: [1, 7, 14]
    });

    expect(measurements).toHaveLength(3);
    expect(measurements[0].day).toBe(1);
    expect(measurements[1].day).toBe(7);
    expect(measurements[2].day).toBe(14);
  });

  it('should show weight decrease over time', () => {
    const measurements = generateMeasurementSeries({
      startWeight: 180,
      startBodyFat: 18,
      measurementDays: [1, 7, 14]
    });

    expect(measurements[1].weight).toBeLessThan(measurements[0].weight);
    expect(measurements[2].weight).toBeLessThan(measurements[1].weight);
  });

  it('should generate recovery metrics', () => {
    const recovery = generateRecoveryMetrics(1);
    expect(recovery.sleep).toBeGreaterThanOrEqual(6.5);
    expect(recovery.sleep).toBeLessThanOrEqual(8.5);
    expect(recovery.soreness).toBeGreaterThanOrEqual(1);
    expect(recovery.soreness).toBeLessThanOrEqual(10);
    expect(recovery.energy).toBeGreaterThanOrEqual(5);
    expect(recovery.energy).toBeLessThanOrEqual(10);
  });
});
