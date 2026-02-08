/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

describe('Sidebar', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    isCollapsed: false,
    setIsCollapsed: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation items', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Exercises')).toBeInTheDocument();
    expect(screen.getByText('Workouts')).toBeInTheDocument();
    expect(screen.getByText('Programs')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders exercise sub-items when expanded', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('All Exercises')).toBeInTheDocument();
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Cardio')).toBeInTheDocument();
    expect(screen.getByText('Flexibility')).toBeInTheDocument();
  });

  it('renders client management section', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Client Management')).toBeInTheDocument();
    expect(screen.getByText('All Clients')).toBeInTheDocument();
    expect(screen.getByText('Active Clients')).toBeInTheDocument();
    expect(screen.getByText('Inactive Clients')).toBeInTheDocument();
  });

  it('renders profile and settings links', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders correct hrefs for nav items', () => {
    render(<Sidebar {...defaultProps} />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    const profileLink = screen.getByText('My Profile').closest('a');
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  it('renders workout tracker link', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Workout Tracker')).toBeInTheDocument();
  });

  it('renders pending and archived client links', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Pending Clients')).toBeInTheDocument();
    expect(screen.getByText('Archived Clients')).toBeInTheDocument();
  });

  it('renders settings link with correct href', () => {
    render(<Sidebar {...defaultProps} />);
    const settingsLink = screen.getByText('Settings').closest('a');
    expect(settingsLink).toHaveAttribute('href', '/profile/edit');
  });

  it('toggles exercises submenu on click', () => {
    render(<Sidebar {...defaultProps} />);
    // Exercises starts expanded
    expect(screen.getByText('All Exercises')).toBeInTheDocument();
    // Click Exercises to collapse
    fireEvent.click(screen.getByText('Exercises'));
    expect(screen.queryByText('All Exercises')).not.toBeInTheDocument();
    // Click again to expand
    fireEvent.click(screen.getByText('Exercises'));
    expect(screen.getByText('All Exercises')).toBeInTheDocument();
  });

  it('toggles client management submenu on click', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('All Clients')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Client Management'));
    expect(screen.queryByText('All Clients')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Client Management'));
    expect(screen.getByText('All Clients')).toBeInTheDocument();
  });

  it('renders overlay when open', () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    const overlay = container.querySelector('.bg-black');
    expect(overlay).toBeTruthy();
  });

  it('calls onClose when overlay clicked', () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    const overlay = container.querySelector('.bg-black.bg-opacity-50');
    if (overlay) {
      fireEvent.click(overlay);
      expect(defaultProps.onClose).toHaveBeenCalled();
    }
  });

  it('does not render overlay when closed', () => {
    const { container } = render(<Sidebar {...defaultProps} isOpen={false} />);
    const overlay = container.querySelector('.bg-black.bg-opacity-50');
    expect(overlay).toBeNull();
  });

  it('renders correct client filter hrefs', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Active Clients').closest('a')).toHaveAttribute('href', '/clients?status=active');
    expect(screen.getByText('Inactive Clients').closest('a')).toHaveAttribute('href', '/clients?status=inactive');
    expect(screen.getByText('Pending Clients').closest('a')).toHaveAttribute('href', '/clients?status=pending');
    expect(screen.getByText('Archived Clients').closest('a')).toHaveAttribute('href', '/clients?status=archived');
  });

  it('calls onClose from mobile menu button', () => {
    render(<Sidebar {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    // First button should be the mobile menu toggle
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      expect(defaultProps.onClose).toHaveBeenCalled();
    }
  });

  it('renders all clients link', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('All Clients').closest('a')).toHaveAttribute('href', '/clients');
  });

  it('renders exercises sub-item links', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('All Exercises').closest('a')).toHaveAttribute('href', '/exercises');
    expect(screen.getByText('Strength').closest('a')).toHaveAttribute('href', '/exercises/strength');
    expect(screen.getByText('Cardio').closest('a')).toHaveAttribute('href', '/exercises/cardio');
    expect(screen.getByText('Flexibility').closest('a')).toHaveAttribute('href', '/exercises/flexibility');
  });

  it('renders analytics href', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Analytics').closest('a')).toHaveAttribute('href', '/analytics');
  });

  it('renders workouts href', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Workouts').closest('a')).toHaveAttribute('href', '/workouts');
  });

  it('renders workout tracker href', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Workout Tracker').closest('a')).toHaveAttribute('href', '/workout-tracker');
  });

  it('renders programs href', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Programs').closest('a')).toHaveAttribute('href', '/programs');
  });

  it('calls onClose when mobile nav item is clicked on small screen', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize'));

    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} isCollapsed={false} setIsCollapsed={jest.fn()} />);

    // Click Dashboard link
    fireEvent.click(screen.getByText('Dashboard'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking sub-items on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize'));

    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} isCollapsed={false} setIsCollapsed={jest.fn()} />);

    // Click All Exercises sub-item
    fireEvent.click(screen.getByText('All Exercises'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking Workouts on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize'));

    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} isCollapsed={false} setIsCollapsed={jest.fn()} />);

    fireEvent.click(screen.getByText('Workouts'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking Programs on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize'));

    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} isCollapsed={false} setIsCollapsed={jest.fn()} />);

    fireEvent.click(screen.getByText('Programs'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking Analytics on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize'));

    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} isCollapsed={false} setIsCollapsed={jest.fn()} />);

    fireEvent.click(screen.getByText('Analytics'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking My Profile on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize'));

    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} isCollapsed={false} setIsCollapsed={jest.fn()} />);

    fireEvent.click(screen.getByText('My Profile'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking Settings on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize'));

    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} isCollapsed={false} setIsCollapsed={jest.fn()} />);

    fireEvent.click(screen.getByText('Settings'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking Client Management sub-items on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize'));

    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} isCollapsed={false} setIsCollapsed={jest.fn()} />);

    fireEvent.click(screen.getByText('All Clients'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking Workout Tracker on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize'));

    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} isCollapsed={false} setIsCollapsed={jest.fn()} />);

    fireEvent.click(screen.getByText('Workout Tracker'));
    expect(onClose).toHaveBeenCalled();
  });

  it('removes resize listener on unmount', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Sidebar {...defaultProps} />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('does not call onClose on desktop clicks', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    window.dispatchEvent(new Event('resize'));

    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} isCollapsed={false} setIsCollapsed={jest.fn()} />);

    fireEvent.click(screen.getByText('Workouts'));
    // onClose should NOT have been called for navigation (only for mobile)
    expect(onClose).not.toHaveBeenCalled();
  });
});
