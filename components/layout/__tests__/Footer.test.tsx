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

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

import Footer from '../Footer';

describe('Footer', () => {
  it('should render the brand name', () => {
    render(<Footer />);
    expect(screen.getByText('EvoFit Fitness')).toBeInTheDocument();
  });

  it('should render the platform subtitle', () => {
    render(<Footer />);
    expect(screen.getByText('Professional Training Platform')).toBeInTheDocument();
  });

  it('should render the logo image', () => {
    render(<Footer />);
    const logo = screen.getByAltText('Logo');
    expect(logo).toBeInTheDocument();
  });

  it('should render Live Updates section', () => {
    render(<Footer />);
    expect(screen.getByText('Live Updates')).toBeInTheDocument();
  });

  it('should render Quick Links section', () => {
    render(<Footer />);
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
  });

  it('should render Workouts link', () => {
    render(<Footer />);
    const link = screen.getByText('Workouts');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/workouts');
  });

  it('should render Exercises link', () => {
    render(<Footer />);
    const link = screen.getByText('Exercises');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/exercises');
  });

  it('should render Programs link', () => {
    render(<Footer />);
    const link = screen.getByText('Programs');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/programs');
  });

  it('should render Clients link', () => {
    render(<Footer />);
    const link = screen.getByText('Clients');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/clients');
  });

  it('should render copyright notice with current year', () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(screen.getByText(`© ${year} EvoFit Fitness. All rights reserved.`)).toBeInTheDocument();
  });

  it('should render the footer element', () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('footer')).toBeInTheDocument();
  });
});
