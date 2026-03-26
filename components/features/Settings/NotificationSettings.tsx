'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff } from 'lucide-react';
import {
  isPushSupported,
  isSubscribed,
  subscribe,
  unsubscribe,
} from '@/lib/services/pushNotificationService';

const PREFS_KEY = 'notification_preferences';
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

interface NotificationPreferences {
  workoutReminders: boolean;
  messageNotifications: boolean;
  prCelebrations: boolean;
  schedulingReminders: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const defaultPreferences: NotificationPreferences = {
  workoutReminders: true,
  messageNotifications: true,
  prCelebrations: true,
  schedulingReminders: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

/**
 * Notification Settings panel.
 * Manages Web Push subscription state and user preferences.
 */
export default function NotificationSettings() {
  const [supported] = useState(() => isPushSupported());
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPreferences);

  // Load saved preferences and subscription state on mount
  useEffect(() => {
    setEnabled(isSubscribed());
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) {
      try {
        setPrefs(JSON.parse(saved));
      } catch {
        // ignore malformed JSON
      }
    }
  }, []);

  const savePrefs = useCallback((updated: NotificationPreferences) => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    setPrefs(updated);
  }, []);

  const handleToggleEnabled = async () => {
    setLoading(true);
    try {
      if (enabled) {
        await unsubscribe();
        setEnabled(false);
      } else {
        const sub = await subscribe(VAPID_PUBLIC_KEY);
        setEnabled(!!sub);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrefChange = (key: keyof NotificationPreferences, value: boolean | string) => {
    const updated = { ...prefs, [key]: value };
    savePrefs(updated);
  };

  const handleTestNotification = () => {
    if (!supported || !enabled) return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification('EvoFit Test Notification', {
          body: 'Push notifications are working!',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        });
      });
    }
  };

  if (!supported) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <BellOff className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Push Notifications</h2>
        </div>
        <p className="text-sm text-gray-500">
          Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Push Notifications</h2>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label
            htmlFor="push-enable"
            className="text-sm font-medium text-gray-700"
          >
            Enable push notifications
          </label>
          <p className="text-xs text-gray-500 mt-0.5">
            Receive notifications even when the app is closed
          </p>
        </div>
        <input
          id="push-enable"
          type="checkbox"
          aria-label="Enable push notifications"
          checked={enabled}
          onChange={handleToggleEnabled}
          disabled={loading}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
        />
      </div>

      {/* Notification types */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700">Notification types</legend>
        <div className="space-y-2">
          {(
            [
              { key: 'workoutReminders', label: 'Workout reminders' },
              { key: 'messageNotifications', label: 'Message notifications' },
              { key: 'prCelebrations', label: 'PR celebrations' },
              { key: 'schedulingReminders', label: 'Scheduling reminders' },
            ] as { key: keyof NotificationPreferences; label: string }[]
          ).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                aria-label={label}
                checked={prefs[key] as boolean}
                onChange={(e) => handlePrefChange(key, e.target.checked)}
                disabled={!enabled}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
              />
              <span className={`text-sm ${!enabled ? 'text-gray-400' : 'text-gray-700'}`}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Quiet hours */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Quiet hours</p>
        <p className="text-xs text-gray-500">No notifications during these hours</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="quiet-start"
              className="block text-xs text-gray-600 mb-1"
            >
              Quiet hours start
            </label>
            <input
              id="quiet-start"
              type="time"
              value={prefs.quietHoursStart}
              onChange={(e) => handlePrefChange('quietHoursStart', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="quiet-end"
              className="block text-xs text-gray-600 mb-1"
            >
              Quiet hours end
            </label>
            <input
              id="quiet-end"
              type="time"
              value={prefs.quietHoursEnd}
              onChange={(e) => handlePrefChange('quietHoursEnd', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Test notification */}
      <button
        type="button"
        onClick={handleTestNotification}
        disabled={!enabled}
        className="inline-flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Bell className="h-4 w-4" />
        Test notification
      </button>
    </div>
  );
}
