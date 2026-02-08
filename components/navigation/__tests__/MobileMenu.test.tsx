/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  role: 'trainer' as const,
  isVerified: true,
};

let mockAuthState: any = {
  user: mockUser,
  isAuthenticated: true,
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('@/config/navigation', () => ({
  getNavigationForRole: () => [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { id: 'exercises', label: 'Exercises', href: '/exercises', icon: 'Dumbbell' },
  ],
}));

jest.mock('../NavigationItem', () => ({
  __esModule: true,
  default: ({ item, onMobileClick }: any) => (
    <div data-testid={`nav-${item.id}`} onClick={onMobileClick}>{item.label}</div>
  ),
}));

jest.mock('../UserMenu', () => ({
  __esModule: true,
  default: () => <div data-testid="user-menu">User Menu</div>,
}));

import MobileMenu from '../MobileMenu';

describe('MobileMenu', () => {
  beforeEach(() => {
    mockAuthState = { user: mockUser, isAuthenticated: true };
  });

  it('should render navigation items when open', () => {
    render(<MobileMenu isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Exercises')).toBeInTheDocument();
  });

  it('should render EvoFit branding', () => {
    render(<MobileMenu isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('EvoFit')).toBeInTheDocument();
  });

  it('should render close button', () => {
    render(<MobileMenu isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<MobileMenu isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close menu'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render UserMenu component', () => {
    render(<MobileMenu isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('should render version info', () => {
    render(<MobileMenu isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('EvoFit v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Personal Training Platform')).toBeInTheDocument();
  });

  it('should render nothing when not authenticated', () => {
    mockAuthState = { user: null, isAuthenticated: false };
    const { container } = render(<MobileMenu isOpen={true} onClose={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('should close on Escape key press', () => {
    const onClose = jest.fn();
    render(<MobileMenu isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    render(<MobileMenu isOpen={true} onClose={onClose} />);
    // Backdrop has aria-hidden="true"
    const backdrop = document.querySelector('[aria-hidden="true"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should set body overflow to hidden when open', () => {
    render(<MobileMenu isOpen={true} onClose={jest.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should render mobile navigation dialog with proper role', () => {
    render(<MobileMenu isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
