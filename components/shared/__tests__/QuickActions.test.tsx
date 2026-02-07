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

import QuickActions from '../QuickActions';

describe('QuickActions', () => {
  const mockActions = [
    {
      id: 'action1',
      title: 'Create Program',
      description: 'Build a new training program',
      icon: <span data-testid="action-icon-1">icon</span>,
      color: 'blue' as const,
      href: '/programs/create',
    },
    {
      id: 'action2',
      title: 'Invite Client',
      description: 'Send a client invitation',
      icon: <span data-testid="action-icon-2">icon</span>,
      color: 'green' as const,
      onClick: jest.fn(),
    },
  ];

  it('should render the title', () => {
    render(<QuickActions actions={mockActions} />);
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should render custom title', () => {
    render(<QuickActions actions={mockActions} title="Shortcuts" />);
    expect(screen.getByText('Shortcuts')).toBeInTheDocument();
  });

  it('should render action titles', () => {
    render(<QuickActions actions={mockActions} />);
    expect(screen.getByText('Create Program')).toBeInTheDocument();
    expect(screen.getByText('Invite Client')).toBeInTheDocument();
  });

  it('should render action descriptions', () => {
    render(<QuickActions actions={mockActions} />);
    expect(screen.getByText('Build a new training program')).toBeInTheDocument();
    expect(screen.getByText('Send a client invitation')).toBeInTheDocument();
  });

  it('should render action icons', () => {
    render(<QuickActions actions={mockActions} />);
    expect(screen.getByTestId('action-icon-1')).toBeInTheDocument();
    expect(screen.getByTestId('action-icon-2')).toBeInTheDocument();
  });

  it('should render link actions as links', () => {
    render(<QuickActions actions={mockActions} />);
    const link = screen.getByText('Create Program').closest('a');
    expect(link).toHaveAttribute('href', '/programs/create');
  });

  it('should render click actions as buttons', () => {
    render(<QuickActions actions={mockActions} />);
    const button = screen.getByText('Invite Client').closest('button');
    expect(button).toBeInTheDocument();
  });

  it('should call onClick when click action is clicked', () => {
    render(<QuickActions actions={mockActions} />);
    const button = screen.getByText('Invite Client').closest('button')!;
    fireEvent.click(button);
    expect(mockActions[1].onClick).toHaveBeenCalledTimes(1);
  });

  it('should render nothing when actions array is empty', () => {
    const { container } = render(<QuickActions actions={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render badge when provided', () => {
    const actionsWithBadge = [
      { ...mockActions[0], badge: '3' },
    ];
    render(<QuickActions actions={actionsWithBadge} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
