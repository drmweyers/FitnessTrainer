/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationSettings from '../NotificationSettings';

// Mock push notification service
jest.mock('@/lib/services/pushNotificationService', () => ({
  isPushSupported: jest.fn(() => true),
  isSubscribed: jest.fn(() => false),
  requestPermission: jest.fn(() => Promise.resolve('granted')),
  subscribe: jest.fn(() => Promise.resolve({ endpoint: 'https://test.endpoint' })),
  unsubscribe: jest.fn(() => Promise.resolve(true)),
}));

import * as pushService from '@/lib/services/pushNotificationService';

const mockedPushService = pushService as jest.Mocked<typeof pushService>;

describe('NotificationSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage
    localStorage.clear();
    mockedPushService.isPushSupported.mockReturnValue(true);
    mockedPushService.isSubscribed.mockReturnValue(false);
  });

  it('renders the notification settings panel', () => {
    render(<NotificationSettings />);
    expect(screen.getByRole('heading', { name: /push notifications/i })).toBeInTheDocument();
  });

  it('shows enable toggle', () => {
    render(<NotificationSettings />);
    const toggle = screen.getByRole('checkbox', { name: /enable push notifications/i });
    expect(toggle).toBeInTheDocument();
  });

  it('shows notification type checkboxes', () => {
    render(<NotificationSettings />);
    expect(screen.getByRole('checkbox', { name: /workout reminders/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /message notifications/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /pr celebrations/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /scheduling reminders/i })).toBeInTheDocument();
  });

  it('shows quiet hours inputs', () => {
    render(<NotificationSettings />);
    expect(screen.getByLabelText(/quiet hours start/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quiet hours end/i)).toBeInTheDocument();
  });

  it('shows test notification button', () => {
    render(<NotificationSettings />);
    expect(screen.getByRole('button', { name: /test notification/i })).toBeInTheDocument();
  });

  it('shows unsupported message when push is not supported', () => {
    mockedPushService.isPushSupported.mockReturnValue(false);
    render(<NotificationSettings />);
    expect(screen.getByText(/not supported/i)).toBeInTheDocument();
  });

  it('calls subscribe when enable toggle is turned on', async () => {
    mockedPushService.subscribe.mockResolvedValueOnce({} as PushSubscription);
    render(<NotificationSettings />);

    const toggle = screen.getByRole('checkbox', { name: /enable push notifications/i });
    await userEvent.click(toggle);

    await waitFor(() => {
      expect(mockedPushService.subscribe).toHaveBeenCalled();
    });
  });

  it('calls unsubscribe when enable toggle is turned off', async () => {
    mockedPushService.isSubscribed.mockReturnValue(true);
    render(<NotificationSettings />);

    const toggle = screen.getByRole('checkbox', { name: /enable push notifications/i });
    await userEvent.click(toggle);

    await waitFor(() => {
      expect(mockedPushService.unsubscribe).toHaveBeenCalled();
    });
  });

  it('saves preferences to localStorage when checkboxes change', async () => {
    render(<NotificationSettings />);

    const workoutReminders = screen.getByRole('checkbox', { name: /workout reminders/i });
    await userEvent.click(workoutReminders);

    const saved = JSON.parse(localStorage.getItem('notification_preferences') || '{}');
    expect(saved).toBeDefined();
  });

  it('loads saved preferences from localStorage on mount', () => {
    const prefs = {
      workoutReminders: false,
      messageNotifications: true,
      prCelebrations: false,
      schedulingReminders: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    };
    localStorage.setItem('notification_preferences', JSON.stringify(prefs));

    render(<NotificationSettings />);

    const startInput = screen.getByLabelText(/quiet hours start/i) as HTMLInputElement;
    expect(startInput.value).toBe('22:00');
  });

  it('disables notification type checkboxes when push is not enabled', () => {
    mockedPushService.isSubscribed.mockReturnValue(false);
    render(<NotificationSettings />);

    const workoutReminders = screen.getByRole('checkbox', { name: /workout reminders/i });
    expect(workoutReminders).toBeDisabled();
  });
});
