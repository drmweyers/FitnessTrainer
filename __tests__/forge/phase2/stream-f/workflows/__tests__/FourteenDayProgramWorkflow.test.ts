import { FourteenDayProgramWorkflow } from '../FourteenDayProgramWorkflow';
import { DailyClientActor } from '../../actors/DailyClientActor';
import { DailyTrainerActor } from '../../actors/DailyTrainerActor';

describe('FourteenDayProgramWorkflow', () => {
  it('should complete 14-day simulation', async () => {
    const client = new DailyClientActor({
      id: 'client-123',
      email: 'client@test.com',
      role: 'client',
      fullName: 'Test Client'
    });

    const trainer = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    const workflow = new FourteenDayProgramWorkflow(client, trainer);
    const result = await workflow.execute();

    expect(result.completed).toBe(true);
    expect(result.daysCompleted).toBe(14);
  });

  it('should accumulate workout data', async () => {
    const client = new DailyClientActor({
      id: 'client-123',
      email: 'client@test.com',
      role: 'client',
      fullName: 'Test Client'
    });

    const trainer = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    const workflow = new FourteenDayProgramWorkflow(client, trainer);
    const result = await workflow.execute();

    expect(result.totalSets).toBeGreaterThan(0);
    expect(result.totalMessages).toBeGreaterThan(0);
    expect(result.dayResults).toHaveLength(14);
  });
});
