/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Mail: () => <span data-testid="icon-mail" />,
  Phone: () => <span data-testid="icon-phone" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  MapPin: () => <span data-testid="icon-map" />,
  Edit: () => <span data-testid="icon-edit" />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

import { ClientProfile } from '../ClientProfile';

describe('ClientProfile', () => {
  const mockClient: any = {
    id: 'c1',
    email: 'john@example.com',
    displayName: 'John Smith',
    createdAt: '2024-01-15',
    trainerClient: { status: 'active' },
    userProfile: {
      profilePhotoUrl: '/photos/john.jpg',
      phone: '555-1234',
      timezone: 'US/Eastern',
    },
    clientProfile: {
      fitnessLevel: 'intermediate',
    },
  };

  it('should render client name', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('should render client email', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getAllByText('john@example.com').length).toBeGreaterThanOrEqual(1);
  });

  it('should render status badge', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render phone number', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  it('should render location/timezone', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText('US/Eastern')).toBeInTheDocument();
  });

  it('should render join date', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText(/Joined/)).toBeInTheDocument();
  });

  it('should render fitness level', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText('intermediate')).toBeInTheDocument();
  });

  it('should render action buttons', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText('View Programs')).toBeInTheDocument();
    expect(screen.getByText('View History')).toBeInTheDocument();
  });

  it('should render edit link', () => {
    render(<ClientProfile client={mockClient} />);
    const editLink = screen.getByTestId('icon-edit').closest('a');
    expect(editLink).toHaveAttribute('href', '/clients/c1/edit');
  });

  it('should show initial when no profile photo', () => {
    const clientNoPhoto = { ...mockClient, userProfile: { ...mockClient.userProfile, profilePhotoUrl: null } };
    render(<ClientProfile client={clientNoPhoto} />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should show email as fallback name when no displayName', () => {
    const clientNoName = { ...mockClient, displayName: undefined };
    render(<ClientProfile client={clientNoName} />);
    expect(screen.getAllByText('john@example.com').length).toBeGreaterThanOrEqual(1);
  });
});
