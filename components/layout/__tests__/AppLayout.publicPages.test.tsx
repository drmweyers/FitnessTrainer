/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

// We need to control usePathname per-test, so we use a variable
let mockPathname = '/';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

jest.mock('@/components/navigation', () => ({
  MainNavigation: ({ showSidebar }: any) => (
    <div data-testid="main-navigation">
      <span data-testid="sidebar-state">{showSidebar ? 'sidebar-on' : 'sidebar-off'}</span>
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

describe('AppLayout - Public Page Detection', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1400,
    });
  });

  const publicPages = [
    '/',
    '/login',
    '/register',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
  ];

  publicPages.forEach((path) => {
    it(`should render minimal layout for public page: ${path}`, () => {
      mockPathname = path;
      render(
        <AppLayout>
          <div data-testid="page-content">Content</div>
        </AppLayout>
      );

      // Public pages should show navigation without sidebar
      expect(screen.getByTestId('sidebar-state')).toHaveTextContent('sidebar-off');

      // Content should render
      expect(screen.getByTestId('page-content')).toBeInTheDocument();

      // Footer should NOT render on public pages (they have their own)
      expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
    });
  });

  it('should render full layout for authenticated pages like /dashboard', () => {
    mockPathname = '/dashboard';
    render(
      <AppLayout>
        <div data-testid="page-content">Content</div>
      </AppLayout>
    );

    // Non-public pages get the full layout with footer
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  it('should render full layout for /exercises page', () => {
    mockPathname = '/exercises';
    render(
      <AppLayout>
        <div data-testid="page-content">Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should render full layout for /programs page', () => {
    mockPathname = '/programs';
    render(
      <AppLayout>
        <div data-testid="page-content">Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
