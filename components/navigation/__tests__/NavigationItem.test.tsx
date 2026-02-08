/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, onClick, ...props }: any) => (
    <a href={href} onClick={onClick} {...props}>{children}</a>
  ),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

jest.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
}));

import NavigationItem from '../NavigationItem';

const MockIcon = ({ size, className }: any) => (
  <span data-testid="nav-icon" className={className}>Icon</span>
);

describe('NavigationItem', () => {
  const simpleItem = {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: MockIcon,
  };

  const itemWithChildren = {
    id: 'programs',
    label: 'Programs',
    href: '/programs',
    icon: MockIcon,
    children: [
      { id: 'my-programs', label: 'My Programs', href: '/programs/mine', icon: MockIcon },
      { id: 'templates', label: 'Templates', href: '/programs/templates', icon: MockIcon },
    ],
  };

  const itemWithBadge = {
    id: 'notifications',
    label: 'Notifications',
    href: '/notifications',
    icon: MockIcon,
    badge: '5',
  };

  it('should render the navigation label', () => {
    render(<NavigationItem item={simpleItem} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render the navigation icon', () => {
    render(<NavigationItem item={simpleItem} />);
    expect(screen.getByTestId('nav-icon')).toBeInTheDocument();
  });

  it('should render as a link for items without children', () => {
    render(<NavigationItem item={simpleItem} />);
    const link = screen.getByText('Dashboard').closest('a');
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('should render as a button for items with children', () => {
    render(<NavigationItem item={itemWithChildren} />);
    const button = screen.getByText('Programs').closest('button');
    expect(button).toBeInTheDocument();
  });

  it('should show chevron right for collapsed parent items', () => {
    render(<NavigationItem item={itemWithChildren} />);
    expect(screen.getByTestId('icon-chevron-right')).toBeInTheDocument();
  });

  it('should show chevron down when expanded', () => {
    render(<NavigationItem item={itemWithChildren} />);
    const button = screen.getByText('Programs').closest('button')!;
    fireEvent.click(button);
    expect(screen.getByTestId('icon-chevron-down')).toBeInTheDocument();
  });

  it('should show children when expanded', () => {
    render(<NavigationItem item={itemWithChildren} />);
    const button = screen.getByText('Programs').closest('button')!;
    fireEvent.click(button);
    expect(screen.getByText('My Programs')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('should hide children when collapsed again', () => {
    render(<NavigationItem item={itemWithChildren} />);
    const button = screen.getByText('Programs').closest('button')!;
    fireEvent.click(button); // expand
    fireEvent.click(button); // collapse
    expect(screen.queryByText('My Programs')).not.toBeInTheDocument();
  });

  it('should render badge when present', () => {
    render(<NavigationItem item={itemWithBadge} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should hide label when isCollapsed is true', () => {
    render(<NavigationItem item={simpleItem} isCollapsed={true} />);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('should call onMobileClick when link item is clicked', () => {
    const onMobileClick = jest.fn();
    render(<NavigationItem item={simpleItem} onMobileClick={onMobileClick} />);
    const link = screen.getByText('Dashboard').closest('a')!;
    fireEvent.click(link);
    expect(onMobileClick).toHaveBeenCalledTimes(1);
  });

  it('should set title attribute when isCollapsed', () => {
    render(<NavigationItem item={simpleItem} isCollapsed={true} />);
    const link = screen.getByTitle('Dashboard');
    expect(link).toBeInTheDocument();
  });
});
