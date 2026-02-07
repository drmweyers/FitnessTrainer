/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('../Header', () => {
  return function MockHeader({ onMenuClick }: any) {
    return <header data-testid="header"><button onClick={onMenuClick}>Menu</button></header>;
  };
});

jest.mock('../Sidebar', () => {
  return function MockSidebar({ isOpen, onClose, isCollapsed }: any) {
    return (
      <nav data-testid="sidebar" data-open={isOpen} data-collapsed={isCollapsed}>
        <button onClick={onClose}>Close Sidebar</button>
      </nav>
    );
  };
});

jest.mock('../Footer', () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer</footer>;
  };
});

import Layout from '../Layout';

describe('Layout', () => {
  it('should render children', () => {
    render(<Layout><div>Page Content</div></Layout>);
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('should render header', () => {
    render(<Layout><div>Content</div></Layout>);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should render sidebar', () => {
    render(<Layout><div>Content</div></Layout>);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should render footer', () => {
    render(<Layout><div>Content</div></Layout>);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should render breadcrumbs when provided', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Programs', href: '/programs' },
    ];
    render(<Layout breadcrumbItems={breadcrumbs}><div>Content</div></Layout>);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Programs')).toBeInTheDocument();
  });

  it('should render breadcrumb navigation element', () => {
    const breadcrumbs = [{ label: 'Home', href: '/' }];
    render(<Layout breadcrumbItems={breadcrumbs}><div>Content</div></Layout>);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('should not render breadcrumbs when not provided', () => {
    render(<Layout><div>Content</div></Layout>);
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });

  it('should toggle sidebar on menu click', () => {
    render(<Layout><div>Content</div></Layout>);
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar.dataset.open).toBe('false');
    fireEvent.click(screen.getByText('Menu'));
    expect(sidebar.dataset.open).toBe('true');
  });
});
