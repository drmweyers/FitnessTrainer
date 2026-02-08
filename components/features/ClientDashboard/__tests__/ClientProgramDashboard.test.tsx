/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientProgramDashboard from '../ClientProgramDashboard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

describe('ClientProgramDashboard', () => {
  const defaultProps = {
    clientId: 'client-1',
  };

  it('renders page content after mount', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);
    // useEffect sets loading=false synchronously in test, so page content renders immediately
    await waitFor(() => {
      expect(screen.getByText('My Training Programs')).toBeInTheDocument();
    });
  });

  it('renders the page title after loading', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('My Training Programs')).toBeInTheDocument();
    });
  });

  it('renders quick stat cards', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Active Programs')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Avg. Adherence')).toBeInTheDocument();
      expect(screen.getByText('Total Workouts')).toBeInTheDocument();
    });
  });

  it('renders mock program assignments', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Strength Foundation Program')).toBeInTheDocument();
      expect(screen.getByText('Cardio Conditioning')).toBeInTheDocument();
    });
  });

  it('shows program descriptions', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Build strength with compound movements')).toBeInTheDocument();
      expect(screen.getByText('Improve cardiovascular endurance')).toBeInTheDocument();
    });
  });

  it('shows program progress information', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('18/36 workouts')).toBeInTheDocument();
      expect(screen.getByText('24/24 workouts')).toBeInTheDocument();
    });
  });

  it('shows status badges', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  it('shows week information', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Week 6 of 12')).toBeInTheDocument();
      expect(screen.getByText('Week 8 of 8')).toBeInTheDocument();
    });
  });

  it('shows trainer notes', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Focus on form over weight progression')).toBeInTheDocument();
      expect(screen.getByText('Great job completing this program!')).toBeInTheDocument();
    });
  });

  it('shows adherence rate', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/85%/)).toBeInTheDocument();
    });
  });

  it('shows Filters button', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });
  });

  it('toggles filters visibility when Filters button is clicked', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Filters'));
    expect(screen.getByText('Search Programs')).toBeInTheDocument();
  });

  it('shows Start Workout button for active programs', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Start Workout')).toBeInTheDocument();
    });
  });

  it('shows View button for programs', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      const viewButtons = screen.getAllByText('View');
      expect(viewButtons.length).toBeGreaterThan(0);
    });
  });

  it('shows assigned by info', async () => {
    render(<ClientProgramDashboard {...defaultProps} />);

    await waitFor(() => {
      const coachElements = screen.getAllByText('Assigned by Coach Sarah');
      expect(coachElements.length).toBe(2);
    });
  });
});
