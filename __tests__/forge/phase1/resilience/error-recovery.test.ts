/**
 * @jest-environment node
 *
 * FORGE Circuit Breaker and Error Recovery Tests
 * Tests circuit breaker pattern and fallback mechanisms
 */

class CircuitBreaker {
  private failures = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastFailureTime?: number;

  constructor(
    private threshold: number,
    private timeoutMs: number
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - (this.lastFailureTime || 0) > this.timeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return this.state;
  }

  getFailureCount() {
    return this.failures;
  }
}

describe('FORGE: Circuit Breaker', () => {
  it('allows requests when closed', async () => {
    const cb = new CircuitBreaker(3, 1000);

    const result = await cb.execute(() => Promise.resolve('success'));

    expect(result).toBe('success');
    expect(cb.getState()).toBe('CLOSED');
  });

  it('opens after threshold failures', async () => {
    const cb = new CircuitBreaker(3, 1000);

    // 3 failures
    for (let i = 0; i < 3; i++) {
      try {
        await cb.execute(() => Promise.reject(new Error('Fail')));
      } catch {}
    }

    expect(cb.getState()).toBe('OPEN');

    // Next request should fail immediately
    await expect(
      cb.execute(() => Promise.resolve('success'))
    ).rejects.toThrow('Circuit breaker is OPEN');
  });

  it('transitions to half-open after timeout', async () => {
    const cb = new CircuitBreaker(1, 50); // 50ms timeout

    try {
      await cb.execute(() => Promise.reject(new Error('Fail')));
    } catch {}

    expect(cb.getState()).toBe('OPEN');

    // Wait for timeout
    await new Promise(r => setTimeout(r, 60));

    // Next request tries (half-open)
    try {
      await cb.execute(() => Promise.reject(new Error('Fail again')));
    } catch {}

    // Should go back to OPEN on failure
    expect(cb.getState()).toBe('OPEN');
  });

  it('closes circuit on success in half-open', async () => {
    const cb = new CircuitBreaker(1, 50);

    try {
      await cb.execute(() => Promise.reject(new Error('Fail')));
    } catch {}

    await new Promise(r => setTimeout(r, 60));

    const result = await cb.execute(() => Promise.resolve('success'));

    expect(result).toBe('success');
    expect(cb.getState()).toBe('CLOSED');
  });

  it('tracks failure count correctly', async () => {
    const cb = new CircuitBreaker(5, 1000);

    expect(cb.getFailureCount()).toBe(0);

    try {
      await cb.execute(() => Promise.reject(new Error('Fail 1')));
    } catch {}
    expect(cb.getFailureCount()).toBe(1);

    try {
      await cb.execute(() => Promise.reject(new Error('Fail 2')));
    } catch {}
    expect(cb.getFailureCount()).toBe(2);
  });

  it('resets failure count on success', async () => {
    const cb = new CircuitBreaker(5, 1000);

    // One failure
    try {
      await cb.execute(() => Promise.reject(new Error('Fail')));
    } catch {}
    expect(cb.getFailureCount()).toBe(1);

    // Success should reset
    await cb.execute(() => Promise.resolve('success'));
    expect(cb.getFailureCount()).toBe(0);
    expect(cb.getState()).toBe('CLOSED');
  });

  it('remains open during timeout period', async () => {
    const cb = new CircuitBreaker(1, 500); // 500ms timeout

    try {
      await cb.execute(() => Promise.reject(new Error('Fail')));
    } catch {}

    expect(cb.getState()).toBe('OPEN');

    // Immediately try again - should still be open
    await expect(
      cb.execute(() => Promise.resolve('success'))
    ).rejects.toThrow('Circuit breaker is OPEN');
  });
});

describe('FORGE: Error Recovery Patterns', () => {
  it('falls back to cached data on API failure', async () => {
    const cache = { get: jest.fn().mockResolvedValue('cached-value') };
    const api = { fetch: jest.fn().mockRejectedValue(new Error('API down')) };

    let result;
    try {
      result = await api.fetch();
    } catch (e) {
      result = await cache.get('key');
    }

    expect(result).toBe('cached-value');
    expect(api.fetch).toHaveBeenCalled();
    expect(cache.get).toHaveBeenCalledWith('key');
  });

  it('uses default value when all sources fail', async () => {
    const primary = jest.fn().mockRejectedValue(new Error('Primary fail'));
    const secondary = jest.fn().mockRejectedValue(new Error('Secondary fail'));
    const defaultValue = 'default';

    let result;
    try {
      result = await primary();
    } catch (e) {
      try {
        result = await secondary();
      } catch (e2) {
        result = defaultValue;
      }
    }

    expect(result).toBe('default');
  });

  it('logs errors for monitoring', async () => {
    const errors: Error[] = [];
    const logError = (e: Error) => errors.push(e);

    const fn = async () => {
      try {
        throw new Error('Operation failed');
      } catch (e) {
        logError(e as Error);
        throw e;
      }
    };

    try {
      await fn();
    } catch {}

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Operation failed');
  });

  it('recovers gracefully after temporary outage', async () => {
    let attempts = 0;
    const service = {
      call: async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return 'success';
      }
    };

    // Retry with backoff
    let result;
    let lastError;
    for (let i = 0; i < 5; i++) {
      try {
        result = await service.call();
        break;
      } catch (e) {
        lastError = e;
        await new Promise(r => setTimeout(r, 10 * Math.pow(2, i)));
      }
    }

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
});
