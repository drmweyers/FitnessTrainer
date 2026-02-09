/**
 * @jest-environment node
 */

// Mock the Upstash Redis client
jest.mock('@upstash/redis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn(),
  };

  return {
    Redis: jest.fn(() => mockRedis),
  };
});

describe('Redis Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Clear the cached redis client by resetting modules
    jest.resetModules();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getRedis', () => {
    it('should return null when UPSTASH_REDIS_REST_URL is not set', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;

      const { getRedis } = require('@/lib/db/redis');
      const client = getRedis();
      expect(client).toBeNull();
    });

    it('should initialize Upstash client when environment is configured', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const { getRedis } = require('@/lib/db/redis');
      const client = getRedis();
      expect(client).not.toBeNull();
    });
  });

  describe('redis.get', () => {
    it('should return null when Redis is not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;

      const { redis } = require('@/lib/db/redis');
      const result = await redis.get('test-key');
      expect(result).toBeNull();
    });

    it('should get value from Redis successfully', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();
      mockInstance.get.mockResolvedValue('test-value');

      const { redis } = require('@/lib/db/redis');
      const result = await redis.get('test-key');

      expect(result).toBe('test-value');
      expect(mockInstance.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null and log warning on error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();
      mockInstance.get.mockRejectedValue(new Error('Connection failed'));

      const { redis } = require('@/lib/db/redis');
      const result = await redis.get('test-key');

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Redis GET failed'),
        'Connection failed'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('redis.set', () => {
    it('should do nothing when Redis is not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();

      const { redis } = require('@/lib/db/redis');
      await redis.set('test-key', 'test-value');

      expect(mockInstance.set).not.toHaveBeenCalled();
    });

    it('should set value without TTL', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();

      const { redis } = require('@/lib/db/redis');
      await redis.set('test-key', 'test-value');

      expect(mockInstance.set).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should set value with TTL', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();

      const { redis } = require('@/lib/db/redis');
      await redis.set('test-key', 'test-value', 300);

      expect(mockInstance.setex).toHaveBeenCalledWith('test-key', 300, 'test-value');
    });

    it('should log warning on error and not throw', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();
      mockInstance.set.mockRejectedValue(new Error('Write failed'));

      const { redis } = require('@/lib/db/redis');
      await expect(redis.set('test-key', 'test-value')).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Redis SET failed'),
        'Write failed'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('redis.del', () => {
    it('should do nothing when Redis is not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();

      const { redis } = require('@/lib/db/redis');
      await redis.del('test-key');

      expect(mockInstance.del).not.toHaveBeenCalled();
    });

    it('should delete key successfully', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();

      const { redis } = require('@/lib/db/redis');
      await redis.del('test-key');

      expect(mockInstance.del).toHaveBeenCalledWith('test-key');
    });

    it('should log warning on error and not throw', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();
      mockInstance.del.mockRejectedValue(new Error('Delete failed'));

      const { redis } = require('@/lib/db/redis');
      await expect(redis.del('test-key')).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Redis DEL failed'),
        'Delete failed'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('redis.incr', () => {
    it('should return 0 when Redis is not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;

      const { redis } = require('@/lib/db/redis');
      const result = await redis.incr('counter');

      expect(result).toBe(0);
    });

    it('should increment counter successfully', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();
      mockInstance.incr.mockResolvedValue(5);

      const { redis } = require('@/lib/db/redis');
      const result = await redis.incr('counter');

      expect(result).toBe(5);
      expect(mockInstance.incr).toHaveBeenCalledWith('counter');
    });

    it('should return 0 on error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();
      mockInstance.incr.mockRejectedValue(new Error('Increment failed'));

      const { redis } = require('@/lib/db/redis');
      const result = await redis.incr('counter');

      expect(result).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('redis.expire', () => {
    it('should do nothing when Redis is not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();

      const { redis } = require('@/lib/db/redis');
      await redis.expire('test-key', 300);

      expect(mockInstance.expire).not.toHaveBeenCalled();
    });

    it('should set expiration successfully', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();

      const { redis } = require('@/lib/db/redis');
      await redis.expire('test-key', 300);

      expect(mockInstance.expire).toHaveBeenCalledWith('test-key', 300);
    });

    it('should log warning on error and not throw', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();
      mockInstance.expire.mockRejectedValue(new Error('Expire failed'));

      const { redis } = require('@/lib/db/redis');
      await expect(redis.expire('test-key', 300)).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('redis.exists', () => {
    it('should return false when Redis is not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;

      const { redis } = require('@/lib/db/redis');
      const result = await redis.exists('test-key');

      expect(result).toBe(false);
    });

    it('should return true when key exists', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();
      mockInstance.exists.mockResolvedValue(1);

      const { redis } = require('@/lib/db/redis');
      const result = await redis.exists('test-key');

      expect(result).toBe(true);
      expect(mockInstance.exists).toHaveBeenCalledWith('test-key');
    });

    it('should return false when key does not exist', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();
      mockInstance.exists.mockResolvedValue(0);

      const { redis } = require('@/lib/db/redis');
      const result = await redis.exists('test-key');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();
      mockInstance.exists.mockRejectedValue(new Error('Check failed'));

      const { redis } = require('@/lib/db/redis');
      const result = await redis.exists('test-key');

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('redis.ping', () => {
    it('should return false when Redis is not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;

      const { redis } = require('@/lib/db/redis');
      const result = await redis.ping();

      expect(result).toBe(false);
    });

    it('should return true when connection is healthy', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();
      mockInstance.set.mockResolvedValue('OK');
      mockInstance.get.mockResolvedValue('ping');
      mockInstance.del.mockResolvedValue(1);

      const { redis } = require('@/lib/db/redis');
      const result = await redis.ping();

      expect(result).toBe(true);
      expect(mockInstance.set).toHaveBeenCalledWith('__redis_health_check__', 'ping');
      expect(mockInstance.get).toHaveBeenCalledWith('__redis_health_check__');
      expect(mockInstance.del).toHaveBeenCalledWith('__redis_health_check__');
    });

    it('should return false when connection fails', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();
      mockInstance.set.mockRejectedValue(new Error('Connection refused'));

      const { redis } = require('@/lib/db/redis');
      const result = await redis.ping();

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Redis PING failed:', 'Connection refused');

      consoleWarnSpy.mockRestore();
    });

    it('should return false when read/write verification fails', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const { Redis } = require('@upstash/redis');
      const mockInstance = new Redis();
      mockInstance.set.mockResolvedValue('OK');
      mockInstance.get.mockResolvedValue('wrong-value'); // Not matching 'ping'
      mockInstance.del.mockResolvedValue(1);

      const { redis } = require('@/lib/db/redis');
      const result = await redis.ping();

      expect(result).toBe(false);
    });
  });
});
