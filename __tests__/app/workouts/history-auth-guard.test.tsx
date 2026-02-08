/** @jest-environment jsdom */

import { render, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import WorkoutHistoryPage from '@/app/workouts/history/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock WorkoutHistory component
jest.mock('@/components/workouts/WorkoutHistory', () => ({
  WorkoutHistory: () => <div>Workout History Component</div>,
}));

describe('WorkoutHistoryPage - Auth Guard', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Clear localStorage
    localStorage.clear();
  });

  it('should redirect to login when no auth token exists', async () => {
    render(<WorkoutHistoryPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('should not redirect when auth token exists', async () => {
    localStorage.setItem('accessToken', 'fake-token');

    render(<WorkoutHistoryPage />);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('should render WorkoutHistory component when authenticated', () => {
    localStorage.setItem('accessToken', 'fake-token');

    const { getByText } = render(<WorkoutHistoryPage />);

    expect(getByText('Workout History Component')).toBeInTheDocument();
  });

  it('should check auth token on mount', () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');

    render(<WorkoutHistoryPage />);

    expect(getItemSpy).toHaveBeenCalledWith('accessToken');

    getItemSpy.mockRestore();
  });
});
