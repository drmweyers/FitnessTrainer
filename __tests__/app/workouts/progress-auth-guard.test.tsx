/** @jest-environment jsdom */

import { render, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import WorkoutProgressPage from '@/app/workouts/progress/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock WorkoutProgress component
jest.mock('@/components/workouts/WorkoutProgress', () => ({
  WorkoutProgress: () => <div>Workout Progress Component</div>,
}));

describe('WorkoutProgressPage - Auth Guard', () => {
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
    render(<WorkoutProgressPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('should not redirect when auth token exists', async () => {
    localStorage.setItem('accessToken', 'fake-token');

    render(<WorkoutProgressPage />);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('should render WorkoutProgress component when authenticated', () => {
    localStorage.setItem('accessToken', 'fake-token');

    const { getByText } = render(<WorkoutProgressPage />);

    expect(getByText('Workout Progress Component')).toBeInTheDocument();
  });

  it('should check auth token on mount', () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');

    render(<WorkoutProgressPage />);

    expect(getItemSpy).toHaveBeenCalledWith('accessToken');

    getItemSpy.mockRestore();
  });
});
