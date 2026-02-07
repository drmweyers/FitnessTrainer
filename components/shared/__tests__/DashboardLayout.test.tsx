/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'trainer@example.com', role: 'trainer' },
  }),
}));

import DashboardLayout from '../DashboardLayout';

describe('DashboardLayout', () => {
  it('should render the title', () => {
    render(
      <DashboardLayout title="My Dashboard">
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('My Dashboard')).toBeInTheDocument();
  });

  it('should render children', () => {
    render(
      <DashboardLayout title="Dashboard">
        <div>Dashboard Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('should render subtitle when provided', () => {
    render(
      <DashboardLayout title="Dashboard" subtitle="Overview of your account">
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Overview of your account')).toBeInTheDocument();
  });

  it('should not render subtitle when not provided', () => {
    render(
      <DashboardLayout title="Dashboard">
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });

  it('should render user role and email', () => {
    render(
      <DashboardLayout title="Dashboard">
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('trainer')).toBeInTheDocument();
    expect(screen.getByText('trainer@example.com')).toBeInTheDocument();
  });

  it('should render actions when provided', () => {
    render(
      <DashboardLayout title="Dashboard" actions={<button>Add New</button>}>
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Add New')).toBeInTheDocument();
  });

  it('should render breadcrumbs when provided', () => {
    render(
      <DashboardLayout
        title="Program Details"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Programs', href: '/programs' },
          { label: 'Program Details' },
        ]}
      >
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Programs')).toBeInTheDocument();
    // "Program Details" appears in both breadcrumb and h1 title
    expect(screen.getAllByText('Program Details').length).toBeGreaterThanOrEqual(2);
  });

  it('should render breadcrumb links for items with href', () => {
    render(
      <DashboardLayout
        title="Details"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Current' },
        ]}
      >
        <div>Content</div>
      </DashboardLayout>
    );
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/dashboard');
  });

  it('should render breadcrumb without link for items without href', () => {
    render(
      <DashboardLayout
        title="Details"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Current Page' },
        ]}
      >
        <div>Content</div>
      </DashboardLayout>
    );
    const currentPage = screen.getByText('Current Page');
    expect(currentPage.closest('a')).toBeNull();
  });

  it('should render breadcrumb navigation', () => {
    render(
      <DashboardLayout
        title="Details"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }]}
      >
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });
});
