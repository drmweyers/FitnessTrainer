import { generateDailyMessages, generateMessageStats } from '../message-generator';

describe('Message Generator', () => {
  it('should generate messages for a workout day', () => {
    const messages = generateDailyMessages({
      day: 1,
      isWorkoutDay: true,
      trainerName: 'Coach Mike',
      clientName: 'John',
      hasPR: false
    });

    expect(messages.length).toBeGreaterThan(0);
    expect(messages.some(m => m.sender === 'trainer')).toBe(true);
  });

  it('should generate messages for a rest day', () => {
    const messages = generateDailyMessages({
      day: 3,
      isWorkoutDay: false,
      trainerName: 'Coach Mike',
      clientName: 'John',
      hasPR: false
    });

    expect(messages.length).toBeGreaterThan(0);
    expect(messages.some(m => m.type === 'recovery')).toBe(true);
  });

  it('should include PR congratulations when PR is achieved', () => {
    const messages = generateDailyMessages({
      day: 4,
      isWorkoutDay: true,
      trainerName: 'Coach Mike',
      clientName: 'John',
      hasPR: true,
      exerciseName: 'Bench Press'
    });

    const content = messages.map(m => m.content).join(' ');
    expect(content.toLowerCase()).toContain('pr');
  });

  it('should generate message stats', () => {
    const messages = generateDailyMessages({
      day: 1,
      isWorkoutDay: true,
      trainerName: 'Coach',
      clientName: 'Client',
      hasPR: false
    });

    const stats = generateMessageStats(messages);
    expect(stats.total).toBe(messages.length);
    expect(stats.trainer).toBeGreaterThan(0);
    expect(stats.client).toBeGreaterThan(0);
  });
});
