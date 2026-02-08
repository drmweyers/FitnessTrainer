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

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockLogout = jest.fn().mockResolvedValue(undefined);
const mockUser = {
  id: 'user-1',
  email: 'john@example.com',
  role: 'trainer' as const,
  isVerified: true,
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    logout: mockLogout,
  }),
}));

jest.mock('@/config/navigation', () => ({
  getUserMenuItems: () => [
    { href: '/profile', label: 'My Profile', icon: () => <span data-testid="menu-icon-profile" /> },
    { href: '/settings', label: 'Settings', icon: () => <span data-testid="menu-icon-settings" /> },
  ],
  roleConfig: {
    trainer: { label: 'Trainer', color: 'bg-blue-100 text-blue-800', dotColor: 'bg-blue-500' },
    client: { label: 'Client', color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' },
    admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800', dotColor: 'bg-purple-500' },
  },
}));

jest.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  LogOut: () => <span data-testid="icon-logout" />,
  User: () => <span data-testid="icon-user" />,
  Settings: () => <span data-testid="icon-settings" />,
  Home: () => <span data-testid="icon-home" />,
  BookOpen: () => <span data-testid="icon-book" />,
  Shield: () => <span data-testid="icon-shield" />,
  AlertTriangle: () => <span data-testid="icon-alert" />,
}));

import UserMenu from '../UserMenu';

describe('UserMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the user avatar with first letter', () => {
    render(<UserMenu />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should render the username (email prefix)', () => {
    render(<UserMenu />);
    expect(screen.getByText('john')).toBeInTheDocument();
  });

  it('should render the role badge', () => {
    render(<UserMenu />);
    expect(screen.getByText('Trainer')).toBeInTheDocument();
  });

  it('should show dropdown when clicked', () => {
    render(<UserMenu />);
    const trigger = screen.getByRole('button', { expanded: false });
    fireEvent.click(trigger);
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('should show user email in dropdown header', () => {
    render(<UserMenu />);
    const trigger = screen.getByRole('button', { expanded: false });
    fireEvent.click(trigger);
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should show menu items', () => {
    render(<UserMenu />);
    const trigger = screen.getByRole('button', { expanded: false });
    fireEvent.click(trigger);
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should show verified shield icon for verified users', () => {
    render(<UserMenu />);
    const trigger = screen.getByRole('button', { expanded: false });
    fireEvent.click(trigger);
    expect(screen.getByTestId('icon-shield')).toBeInTheDocument();
  });

  it('should show logout confirmation when Sign Out is clicked', () => {
    render(<UserMenu />);
    const trigger = screen.getByRole('button', { expanded: false });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByText('Sign Out'));
    expect(screen.getByText('Confirm Sign Out')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to sign out?')).toBeInTheDocument();
  });

  it('should show Cancel button in logout confirmation', () => {
    render(<UserMenu />);
    const trigger = screen.getByRole('button', { expanded: false });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByText('Sign Out'));
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should cancel logout when Cancel is clicked', () => {
    render(<UserMenu />);
    const trigger = screen.getByRole('button', { expanded: false });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByText('Sign Out'));
    fireEvent.click(screen.getByText('Cancel'));
    // Should go back to normal sign out button
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(screen.queryByText('Confirm Sign Out')).not.toBeInTheDocument();
  });

  it('should render nothing when not authenticated', () => {
    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: jest.fn(),
    });
    const { container } = render(<UserMenu />);
    expect(container.firstChild).toBeNull();
  });
});
