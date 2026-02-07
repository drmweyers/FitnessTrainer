/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="icon-trending" />,
  Activity: () => <span data-testid="icon-activity" />,
  Target: () => <span data-testid="icon-target" />,
  Award: () => <span data-testid="icon-award" />,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
}));

import { ClientProgress } from '../ClientProgress';

describe('ClientProgress', () => {
  it('should render section title', () => {
    render(<ClientProgress clientId="c1" />);
    expect(screen.getByText('Progress Overview')).toBeInTheDocument();
  });

  it('should render description', () => {
    render(<ClientProgress clientId="c1" />);
    expect(screen.getByText("Client's performance metrics and achievements")).toBeInTheDocument();
  });

  it('should render stat cards', () => {
    render(<ClientProgress clientId="c1" />);
    expect(screen.getByText('Total Workouts')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('Avg Duration')).toBeInTheDocument();
    expect(screen.getByText('Total Volume')).toBeInTheDocument();
  });

  it('should render stat values', () => {
    render(<ClientProgress clientId="c1" />);
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('55min')).toBeInTheDocument();
    expect(screen.getByText('125K')).toBeInTheDocument();
  });

  it('should render improvement rate', () => {
    render(<ClientProgress clientId="c1" />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('Compared to previous month')).toBeInTheDocument();
  });

  it('should render performance trend section', () => {
    render(<ClientProgress clientId="c1" />);
    expect(screen.getByText('Performance Trend')).toBeInTheDocument();
  });

  it('should render recent achievements', () => {
    render(<ClientProgress clientId="c1" />);
    expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
    expect(screen.getByText('30 Workouts')).toBeInTheDocument();
    expect(screen.getByText('100K Total Volume')).toBeInTheDocument();
    expect(screen.getByText('Consistency Streak')).toBeInTheDocument();
  });

  it('should render award icons', () => {
    render(<ClientProgress clientId="c1" />);
    const awardIcons = screen.getAllByTestId('icon-award');
    expect(awardIcons).toHaveLength(3);
  });
});
