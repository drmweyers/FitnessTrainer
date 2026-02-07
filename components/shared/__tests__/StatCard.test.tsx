/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

import StatCard from '../StatCard';

describe('StatCard', () => {
  const defaultProps = {
    id: 'test-stat',
    title: 'Total Clients',
    value: 42,
    icon: <span data-testid="stat-icon">icon</span>,
    color: 'blue' as const,
  };

  it('should render the title', () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByText('Total Clients')).toBeInTheDocument();
  });

  it('should render a numeric value formatted with locale', () => {
    render(<StatCard {...defaultProps} value={1500} />);
    expect(screen.getByText('1,500')).toBeInTheDocument();
  });

  it('should render a string value as-is', () => {
    render(<StatCard {...defaultProps} value="85%" />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('should render the icon', () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });

  it('should render subtitle when provided', () => {
    render(<StatCard {...defaultProps} subtitle="from last month" />);
    expect(screen.getByText('from last month')).toBeInTheDocument();
  });

  it('should not render subtitle when not provided', () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.queryByText('from last month')).not.toBeInTheDocument();
  });

  it('should render change indicator when provided', () => {
    render(
      <StatCard
        {...defaultProps}
        change={{ value: 12, type: 'increase', period: 'vs last month' }}
      />
    );
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('should render negative change', () => {
    render(
      <StatCard
        {...defaultProps}
        change={{ value: -5, type: 'decrease', period: 'vs last week' }}
      />
    );
    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('should render with different colors', () => {
    const { rerender } = render(<StatCard {...defaultProps} color="green" />);
    expect(screen.getByText('Total Clients')).toBeInTheDocument();

    rerender(<StatCard {...defaultProps} color="red" />);
    expect(screen.getByText('Total Clients')).toBeInTheDocument();

    rerender(<StatCard {...defaultProps} color="purple" />);
    expect(screen.getByText('Total Clients')).toBeInTheDocument();
  });
});
