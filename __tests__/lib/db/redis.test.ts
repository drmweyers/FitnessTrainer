/**
 * Tests for lib/db/redis.ts
 * Tests the redis wrapper functions with mocked Upstash client.
 */

// Mock @upstash/redis before importing the module
const mockUpstashClient = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  exists: jest.fn(),
};

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(() => mockUpstashClient),
}));

describe('lib/db/redis', () => {
  describe('when UPSTASH_REDIS_REST_URL is not set', () => {
    let redis: typeof import('@/lib/db/redis').redis;

    beforeEach(() => {
      jest.resetModules();
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    it('returns null/defaults when no Redis URL configured', async () => {
      const mod = require('@/lib/db/redis');
      redis = mod.redis;

      expect(await redis.get('key')).toBeNull();
      expect(await redis.incr('key')).toBe(0);
      expect(await redis.exists('key')).toBe(false);

      // These should not throw
      await redis.set('key', 'value');
      await redis.del('key');
      await redis.expire('key', 60);
    });
  });

  describe('when UPSTASH_REDIS_REST_URL is set', () => {
    let redis: typeof import('@/lib/db/redis').redis;
    let getRedis: typeof import('@/lib/db/redis').getRedis;

    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
      process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      const mod = require('@/lib/db/redis');
      redis = mod.redis;
      getRedis = mod.getRedis;
    });

    afterEach(() => {
      (console.log as jest.Mock).mockRestore();
      (console.warn as jest.Mock).mockRestore();
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    it('getRedis returns an Upstash client', () => {
      const client = getRedis();
      expect(client).toBeDefined();
    });

    it('redis.get delegates to Upstash client', async () => {
      mockUpstashClient.get.mockResolvedValue('cached-value');

      const result = await redis.get('my-key');

      expect(result).toBe('cached-value');
      expect(mockUpstashClient.get).toHaveBeenCalledWith('my-key');
    });

    it('redis.set without TTL delegates to client.set', async () => {
      await redis.set('my-key', 'my-value');

      expect(mockUpstashClient.set).toHaveBeenCalledWith('my-key', 'my-value');
    });

    it('redis.set with TTL delegates to client.setex', async () => {
      await redis.set('my-key', 'my-value', 3600);

      expect(mockUpstashClient.setex).toHaveBeenCalledWith('my-key', 3600, 'my-value');
    });

    it('redis.del delegates to Upstash client', async () => {
      await redis.del('my-key');

      expect(mockUpstashClient.del).toHaveBeenCalledWith('my-key');
    });

    it('redis.incr delegates to Upstash client', async () => {
      mockUpstashClient.incr.mockResolvedValue(5);

      const result = await redis.incr('counter');

      expect(result).toBe(5);
      expect(mockUpstashClient.incr).toHaveBeenCalledWith('counter');
    });

    it('redis.expire delegates to Upstash client', async () => {
      await redis.expire('my-key', 300);

      expect(mockUpstashClient.expire).toHaveBeenCalledWith('my-key', 300);
    });

    it('redis.exists returns true when key exists', async () => {
      mockUpstashClient.exists.mockResolvedValue(1);

      const result = await redis.exists('my-key');

      expect(result).toBe(true);
    });

    it('redis.exists returns false when key does not exist', async () => {
      mockUpstashClient.exists.mockResolvedValue(0);

      const result = await redis.exists('missing-key');

      expect(result).toBe(false);
    });
  });
});
