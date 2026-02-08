/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

jest.mock('lucide-react', () => ({
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  Home: () => <span data-testid="icon-home" />,
}));

import BreadcrumbNav from '../BreadcrumbNav';

describe('BreadcrumbNav', () => {
  it('should render nothing when items array is empty', () => {
    const { container } = render(<BreadcrumbNav items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render a breadcrumb nav element', () => {
    render(<BreadcrumbNav items={[{ label: 'Page', href: '/page' }]} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('should prepend Home item by default', () => {
    render(<BreadcrumbNav items={[{ label: 'Programs', href: '/programs' }]} />);
    expect(screen.getByTestId('icon-home')).toBeInTheDocument();
  });

  it('should not prepend Home when showHome is false', () => {
    render(<BreadcrumbNav items={[{ label: 'Programs', href: '/programs' }]} showHome={false} />);
    expect(screen.queryByTestId('icon-home')).not.toBeInTheDocument();
  });

  it('should render item labels', () => {
    render(
      <BreadcrumbNav items={[
        { label: 'Programs', href: '/programs' },
        { label: 'Strength Builder', href: '/programs/1' },
      ]} />
    );
    expect(screen.getByText('Programs')).toBeInTheDocument();
    expect(screen.getByText('Strength Builder')).toBeInTheDocument();
  });

  it('should render separator between items', () => {
    render(
      <BreadcrumbNav items={[
        { label: 'Programs', href: '/programs' },
        { label: 'Edit', href: '/programs/edit' },
      ]} />
    );
    // Home -> Programs -> Edit = 2 separators
    const chevrons = screen.getAllByTestId('icon-chevron-right');
    expect(chevrons.length).toBe(2);
  });

  it('should render the last item as text (not a link)', () => {
    render(
      <BreadcrumbNav items={[
        { label: 'Programs', href: '/programs' },
        { label: 'Current Page', href: '/programs/1' },
      ]} />
    );
    const currentPage = screen.getByText('Current Page');
    // Last item should be a span, not wrapped in a link
    expect(currentPage.closest('a')).toBeNull();
  });

  it('should render non-last items as links', () => {
    render(
      <BreadcrumbNav items={[
        { label: 'Programs', href: '/programs' },
        { label: 'Current Page', href: '/programs/1' },
      ]} />
    );
    // "Home" link exists
    const homeLinks = screen.getAllByText('Home');
    expect(homeLinks[0].closest('a')).toHaveAttribute('href', '/dashboard');
    // "Programs" link exists
    const programsLink = screen.getByText('Programs');
    expect(programsLink.closest('a')).toHaveAttribute('href', '/programs');
  });

  it('should render icon for items that have one', () => {
    const CustomIcon = () => <span data-testid="custom-icon" />;
    render(
      <BreadcrumbNav items={[{ label: 'Custom', href: '/custom', icon: CustomIcon }]} />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
