/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

jest.mock('lucide-react', () => ({
  Menu: () => <span data-testid="icon-menu" />,
  Bell: () => <span data-testid="icon-bell" />,
}));

const mockUser = {
  id: 'user-1',
  email: 'trainer@example.com',
  role: 'trainer' as const,
  isVerified: true,
};

let mockAuthState = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('@/config/navigation', () => ({
  getNavigationForRole: () => [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { id: 'clients', label: 'Clients', href: '/clients', icon: 'Users' },
  ],
}));

jest.mock('../UserMenu', () => ({
  __esModule: true,
  default: () => <div data-testid="user-menu">User Menu</div>,
}));

jest.mock('../NavigationItem', () => ({
  __esModule: true,
  default: ({ item }: any) => <div data-testid={`nav-item-${item.id}`}>{item.label}</div>,
}));

jest.mock('../MobileMenu', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mobile-menu">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

import MainNavigation from '../MainNavigation';

describe('MainNavigation', () => {
  beforeEach(() => {
    mockAuthState = {
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
    };
  });

  it('should render the EvoFit brand name', () => {
    render(<MainNavigation />);
    expect(screen.getByText('EvoFit')).toBeInTheDocument();
  });

  it('should render the logo letter E', () => {
    render(<MainNavigation />);
    expect(screen.getByText('E')).toBeInTheDocument();
  });

  it('should render notification bell for authenticated users', () => {
    render(<MainNavigation />);
    expect(screen.getByTestId('icon-bell')).toBeInTheDocument();
  });

  it('should render notification badge count', () => {
    render(<MainNavigation />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render UserMenu for authenticated users', () => {
    render(<MainNavigation />);
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('should render sidebar with navigation items', () => {
    render(<MainNavigation showSidebar={true} />);
    expect(screen.getByTestId('nav-item-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-clients')).toBeInTheDocument();
  });

  it('should show Sign In and Get Started for unauthenticated users', () => {
    mockAuthState = { user: null as any, isAuthenticated: false, isLoading: false };
    render(<MainNavigation />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('should not show UserMenu for unauthenticated users', () => {
    mockAuthState = { user: null as any, isAuthenticated: false, isLoading: false };
    render(<MainNavigation />);
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
  });

  it('should show loading skeleton when auth is loading', () => {
    mockAuthState = { user: null as any, isAuthenticated: false, isLoading: true };
    render(<MainNavigation />);
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render mobile menu button for authenticated users', () => {
    render(<MainNavigation />);
    expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
  });

  it('should open mobile menu when menu button is clicked', () => {
    render(<MainNavigation />);
    fireEvent.click(screen.getByLabelText('Open navigation menu'));
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
  });

  it('should render sidebar toggle button when showSidebar is true and onToggleCollapse provided', () => {
    const onToggle = jest.fn();
    render(<MainNavigation showSidebar={true} onToggleCollapse={onToggle} />);
    const collapseBtn = screen.getByLabelText('Collapse sidebar');
    expect(collapseBtn).toBeInTheDocument();
  });

  it('should call onToggleCollapse when sidebar toggle is clicked', () => {
    const onToggle = jest.fn();
    render(<MainNavigation showSidebar={true} onToggleCollapse={onToggle} />);
    fireEvent.click(screen.getByLabelText('Collapse sidebar'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should show Expand sidebar label when isCollapsed is true', () => {
    const onToggle = jest.fn();
    render(<MainNavigation showSidebar={true} isCollapsed={true} onToggleCollapse={onToggle} />);
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
  });

  it('should not show sidebar when showSidebar is false', () => {
    render(<MainNavigation showSidebar={false} />);
    expect(screen.queryByTestId('nav-item-dashboard')).not.toBeInTheDocument();
  });
});
