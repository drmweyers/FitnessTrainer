/**
 * Push Notification Service
 *
 * Client-side push subscription manager using the Web Push API (browser-native).
 * Handles permission requests, subscription management, and storage.
 */

const PUSH_SUBSCRIPTION_KEY = 'push_subscription';

/**
 * Requests push notification permission from the user.
 * Returns the Notification permission state.
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  return Notification.requestPermission();
}

/**
 * Subscribes the current browser to push notifications.
 * Saves subscription to localStorage and syncs to API.
 *
 * @param vapidPublicKey - VAPID public key from server
 * @returns PushSubscription or null if not supported / permission denied
 */
export async function subscribe(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  const permission = await requestPermission();
  if (permission !== 'granted') {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    // Persist locally
    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, JSON.stringify(subscription));

    // Sync to API
    await syncSubscriptionToServer(subscription, 'subscribe');

    return subscription;
  } catch (error) {
    console.error('[PushNotifications] Subscribe failed:', error);
    return null;
  }
}

/**
 * Unsubscribes the current browser from push notifications.
 * Removes from localStorage and syncs removal to API.
 *
 * @returns true on success, false on failure
 */
export async function unsubscribe(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
      return true;
    }

    // Sync removal to API before unsubscribing
    await syncSubscriptionToServer(subscription, 'unsubscribe');

    await subscription.unsubscribe();
    localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
    return true;
  } catch (error) {
    console.error('[PushNotifications] Unsubscribe failed:', error);
    return false;
  }
}

/**
 * Checks if push notifications are currently enabled.
 */
export function isSubscribed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PUSH_SUBSCRIPTION_KEY) !== null;
}

/**
 * Checks if push notifications are supported in this browser.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Syncs push subscription state with the server API.
 */
async function syncSubscriptionToServer(
  subscription: PushSubscription,
  action: 'subscribe' | 'unsubscribe'
): Promise<void> {
  const token = localStorage.getItem('accessToken');
  if (!token) return;

  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ subscription: subscription.toJSON(), action }),
  });
}

/**
 * Converts a URL-safe base64 string to a Uint8Array.
 * Required by PushManager.subscribe() for the applicationServerKey.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
