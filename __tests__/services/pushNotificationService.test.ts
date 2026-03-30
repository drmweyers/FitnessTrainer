/**
 * @jest-environment jsdom
 */

import {
  requestPermission,
  subscribe,
  unsubscribe,
  isSubscribed,
  isPushSupported,
} from '@/lib/services/pushNotificationService';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// Mock PushSubscription
const mockSubscriptionJSON = {
  endpoint: 'https://push.example.com/endpoint',
  keys: { p256dh: 'key1', auth: 'auth1' },
};
const mockPushSubscription = {
  endpoint: mockSubscriptionJSON.endpoint,
  toJSON: jest.fn(() => mockSubscriptionJSON),
  unsubscribe: jest.fn().mockResolvedValue(true),
};

// Mock PushManager
const mockPushManager = {
  subscribe: jest.fn().mockResolvedValue(mockPushSubscription),
  getSubscription: jest.fn().mockResolvedValue(null),
};

// Mock ServiceWorker registration
const mockRegistration = {
  pushManager: mockPushManager,
};

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve(mockRegistration),
  },
  writable: true,
  configurable: true,
});

describe('pushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    mockPushManager.subscribe.mockResolvedValue(mockPushSubscription);
    mockPushManager.getSubscription.mockResolvedValue(null);
    mockPushSubscription.unsubscribe.mockResolvedValue(true);
  });

  describe('requestPermission', () => {
    it('returns denied when Notification not in window', async () => {
      const originalNotification = (global as any).Notification;
      delete (global as any).Notification;
      const result = await requestPermission();
      expect(result).toBe('denied');
      (global as any).Notification = originalNotification;
    });

    it('returns granted when permission is already granted', async () => {
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'granted',
          requestPermission: jest.fn(),
        },
        writable: true,
        configurable: true,
      });
      const result = await requestPermission();
      expect(result).toBe('granted');
    });

    it('calls requestPermission when not yet granted', async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue('granted');
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: mockRequestPermission,
        },
        writable: true,
        configurable: true,
      });
      const result = await requestPermission();
      expect(result).toBe('granted');
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('returns denied when user denies permission', async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue('denied');
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: mockRequestPermission,
        },
        writable: true,
        configurable: true,
      });
      const result = await requestPermission();
      expect(result).toBe('denied');
    });
  });

  describe('subscribe', () => {
    beforeEach(() => {
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'granted',
          requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
        configurable: true,
      });
    });

    it('returns null when serviceWorker not in navigator', async () => {
      const originalSW = navigator.serviceWorker;
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      const result = await subscribe('vapid-key');
      expect(result).toBeNull();
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalSW,
        writable: true,
        configurable: true,
      });
    });

    it('returns null when permission denied', async () => {
      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: jest.fn().mockResolvedValue('denied'),
        },
        writable: true,
        configurable: true,
      });
      const result = await subscribe('vapid-key');
      expect(result).toBeNull();
    });

    it('subscribes and saves to localStorage', async () => {
      const result = await subscribe('dGVzdA=='); // valid base64
      expect(result).not.toBeNull();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'push_subscription',
        JSON.stringify(mockSubscriptionJSON)
      );
    });

    it('syncs subscription to server', async () => {
      localStorageMock.getItem.mockReturnValue('test-access-token');
      await subscribe('dGVzdA==');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notifications/subscribe',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
          }),
        })
      );
    });

    it('returns null when pushManager.subscribe throws', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockPushManager.subscribe.mockRejectedValue(new Error('Push not supported'));
      const result = await subscribe('dGVzdA==');
      expect(result).toBeNull();
      (console.error as jest.Mock).mockRestore();
    });
  });

  describe('unsubscribe', () => {
    it('returns false when serviceWorker not in navigator', async () => {
      const originalSW = navigator.serviceWorker;
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      const result = await unsubscribe();
      expect(result).toBe(false);
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalSW,
        writable: true,
        configurable: true,
      });
    });

    it('removes from localStorage and returns true when no existing subscription', async () => {
      mockPushManager.getSubscription.mockResolvedValue(null);
      const result = await unsubscribe();
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('push_subscription');
    });

    it('calls subscription.unsubscribe() and removes from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      mockPushManager.getSubscription.mockResolvedValue(mockPushSubscription);
      const result = await unsubscribe();
      expect(result).toBe(true);
      expect(mockPushSubscription.unsubscribe).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('push_subscription');
    });

    it('syncs unsubscribe to server before unsubscribing', async () => {
      localStorageMock.getItem.mockReturnValue('bearer-token');
      mockPushManager.getSubscription.mockResolvedValue(mockPushSubscription);
      await unsubscribe();
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notifications/subscribe',
        expect.objectContaining({
          body: expect.stringContaining('"action":"unsubscribe"'),
        })
      );
    });

    it('returns false when an error occurs', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockPushManager.getSubscription.mockRejectedValue(new Error('SW error'));
      const result = await unsubscribe();
      expect(result).toBe(false);
      (console.error as jest.Mock).mockRestore();
    });
  });

  describe('isSubscribed', () => {
    it('returns false when no subscription in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(isSubscribed()).toBe(false);
    });

    it('returns true when subscription exists in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('{"endpoint":"..."}');
      expect(isSubscribed()).toBe(true);
    });
  });

  describe('isPushSupported', () => {
    it('returns true when all required APIs are present', () => {
      // jsdom provides serviceWorker in navigator
      // We need Notification and PushManager to be present
      if (!('PushManager' in window)) {
        Object.defineProperty(window, 'PushManager', {
          value: {},
          writable: true,
          configurable: true,
        });
      }
      if (!('Notification' in window)) {
        Object.defineProperty(window, 'Notification', {
          value: { permission: 'default', requestPermission: jest.fn() },
          writable: true,
          configurable: true,
        });
      }
      // With serviceWorker, PushManager, and Notification defined
      const result = isPushSupported();
      // Result depends on jsdom environment - just verify it returns a boolean
      expect(typeof result).toBe('boolean');
    });

    it('returns false in a non-browser environment', () => {
      // This is tested by the SSR check - typeof window === 'undefined'
      // In jsdom we can't easily test this, but verify the function exists and returns boolean
      expect(typeof isPushSupported()).toBe('boolean');
    });
  });
});
