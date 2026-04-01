/**
 * @jest-environment node
 *
 * FORGE Retry Logic Tests
 * Tests exponential backoff and retry mechanisms
 */

class RetryService {
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: { maxRetries: number; delayMs: number }
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= options.maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < options.maxRetries) {
          const delay = options.delayMs * Math.pow(2, i);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw lastError!;
  }
}

describe('FORGE: Retry Logic', () => {
  it('succeeds on first attempt', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      return 'success';
    };

    const result = await RetryService.withRetry(fn, { maxRetries: 3, delayMs: 10 });

    expect(result).toBe('success');
    expect(attempts).toBe(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('Temporary failure');
      return 'success';
    };

    const result = await RetryService.withRetry(fn, { maxRetries: 3, delayMs: 10 });

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('fails after max retries exceeded', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      throw new Error('Persistent failure');
    };

    await expect(
      RetryService.withRetry(fn, { maxRetries: 2, delayMs: 10 })
    ).rejects.toThrow('Persistent failure');

    expect(attempts).toBe(3); // Initial + 2 retries
  });

  it('uses exponential backoff', async () => {
    const delays: number[] = [];
    let lastTime = Date.now();

    const fn = async () => {
      const now = Date.now();
      delays.push(now - lastTime);
      lastTime = now;
      throw new Error('Fail');
    };

    try {
      await RetryService.withRetry(fn, { maxRetries: 3, delayMs: 50 });
    } catch {}

    // Delays should be roughly 50, 100, 200ms
    expect(delays[1]).toBeGreaterThanOrEqual(40);
    expect(delays[2]).toBeGreaterThanOrEqual(80);
    expect(delays[3]).toBeGreaterThanOrEqual(160);
  });

  it('retries with increasing delays', async () => {
    const delays: number[] = [];
    const startTime = Date.now();
    let lastAttemptTime = startTime;

    let attempts = 0;
    const fn = async () => {
      const now = Date.now();
      if (attempts > 0) {
        delays.push(now - lastAttemptTime);
      }
      lastAttemptTime = now;
      attempts++;
      if (attempts < 4) throw new Error('Retry needed');
      return 'success';
    };

    await RetryService.withRetry(fn, { maxRetries: 5, delayMs: 25 });

    // Should have 3 delays (between 4 attempts)
    expect(delays).toHaveLength(3);
    // Each delay should be roughly double the previous
    expect(delays[1]).toBeGreaterThan(delays[0]);
    expect(delays[2]).toBeGreaterThan(delays[1]);
  });

  it('resets retry count for new operations', async () => {
    let attempts1 = 0;
    let attempts2 = 0;

    const fn1 = async () => {
      attempts1++;
      if (attempts1 < 2) throw new Error('Fail');
      return 'success1';
    };

    const fn2 = async () => {
      attempts2++;
      return 'success2';
    };

    const result1 = await RetryService.withRetry(fn1, { maxRetries: 3, delayMs: 10 });
    const result2 = await RetryService.withRetry(fn2, { maxRetries: 3, delayMs: 10 });

    expect(result1).toBe('success1');
    expect(result2).toBe('success2');
    expect(attempts1).toBe(2);
    expect(attempts2).toBe(1);
  });
});
