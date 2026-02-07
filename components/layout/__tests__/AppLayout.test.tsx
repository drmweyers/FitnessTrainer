/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

let mockAuthState: any = {
  isAuthenticated: true,
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('@/components/navigation', () => ({
  MainNavigation: ({ showSidebar, isCollapsed, onToggleCollapse }: any) => (
    <div data-testid="main-navigation">
      <span>{showSidebar ? 'sidebar-on' : 'sidebar-off'}</span>
    </div>
  ),
  BreadcrumbNav: ({ items }: any) => (
    <div data-testid="breadcrumb-nav">
      {items.map((item: any) => <span key={item.href}>{item.label}</span>)}
    </div>
  ),
}));

jest.mock('../Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>,
}));

import AppLayout from '../AppLayout';

describe('AppLayout', () => {
  beforeEach(() => {
    mockAuthState = { isAuthenticated: true };
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1400,
    });
  });

  it('should render children', () => {
    render(
      <AppLayout>
        <div>Page Content</div>
      </AppLayout>
    );
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('should render MainNavigation', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );
    expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
  });

  it('should render Footer', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should show sidebar for authenticated users', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );
    expect(screen.getByText('sidebar-on')).toBeInTheDocument();
  });

  it('should hide sidebar when showSidebar is false', () => {
    render(
      <AppLayout showSidebar={false}>
        <div>Content</div>
      </AppLayout>
    );
    expect(screen.getByText('sidebar-off')).toBeInTheDocument();
  });

  it('should hide sidebar for unauthenticated users', () => {
    mockAuthState = { isAuthenticated: false };
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );
    expect(screen.getByText('sidebar-off')).toBeInTheDocument();
  });

  it('should render breadcrumbs when provided and authenticated', () => {
    render(
      <AppLayout breadcrumbItems={[{ label: 'Dashboard', href: '/dashboard' }]}>
        <div>Content</div>
      </AppLayout>
    );
    expect(screen.getByTestId('breadcrumb-nav')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should not render breadcrumbs when not provided', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );
    expect(screen.queryByTestId('breadcrumb-nav')).not.toBeInTheDocument();
  });
});
