/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="icon-calendar" />,
  Clock: () => <span data-testid="icon-clock" />,
  BookOpen: () => <span data-testid="icon-book" />,
  Plus: () => <span data-testid="icon-plus" />,
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
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div className={className} role="progressbar" aria-valuenow={value}>
      {value}%
    </div>
  ),
}));

import { ClientPrograms } from '../ClientPrograms';

describe('ClientPrograms', () => {
  it('should render section title', () => {
    render(<ClientPrograms clientId="c1" />);
    expect(screen.getByText('Assigned Programs')).toBeInTheDocument();
  });

  it('should render Assign Program button', () => {
    render(<ClientPrograms clientId="c1" />);
    expect(screen.getByText('Assign Program')).toBeInTheDocument();
  });

  it('should render program names', () => {
    render(<ClientPrograms clientId="c1" />);
    expect(screen.getByText('12-Week Strength Program')).toBeInTheDocument();
    expect(screen.getByText('Fat Loss Challenge')).toBeInTheDocument();
  });

  it('should render program descriptions', () => {
    render(<ClientPrograms clientId="c1" />);
    expect(screen.getByText('Comprehensive strength training program')).toBeInTheDocument();
    expect(screen.getByText('High-intensity interval training for fat loss')).toBeInTheDocument();
  });

  it('should render program type badges', () => {
    render(<ClientPrograms clientId="c1" />);
    expect(screen.getByText('strength')).toBeInTheDocument();
    expect(screen.getByText('hiit')).toBeInTheDocument();
  });

  it('should render progress percentages', () => {
    render(<ClientPrograms clientId="c1" />);
    // Progress appears in both the label and the Progress component mock
    expect(screen.getAllByText('65%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('30%').length).toBeGreaterThanOrEqual(1);
  });

  it('should render upcoming workout names', () => {
    render(<ClientPrograms clientId="c1" />);
    expect(screen.getByText('Leg Day')).toBeInTheDocument();
    expect(screen.getByText('HIIT Cardio')).toBeInTheDocument();
  });

  it('should render View Details buttons', () => {
    render(<ClientPrograms clientId="c1" />);
    const detailButtons = screen.getAllByText('View Details');
    expect(detailButtons).toHaveLength(2);
  });

  it('should render duration badges', () => {
    render(<ClientPrograms clientId="c1" />);
    expect(screen.getByText('12 Weeks')).toBeInTheDocument();
    expect(screen.getByText('8 Weeks')).toBeInTheDocument();
  });
});
