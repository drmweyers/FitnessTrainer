/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="icon-alert" />,
  Plus: () => <span data-testid="icon-plus" />,
}));

import LimitationsSection from '../LimitationsSection';

describe('LimitationsSection', () => {
  const mockLimitations = [
    { id: '1', text: 'Lower back injury - avoid heavy deadlifts' },
    { id: '2', text: 'Knee issues - no deep squats' },
  ];

  it('should render section title', () => {
    render(<LimitationsSection limitations={mockLimitations} />);
    expect(screen.getByText('Limitations & Considerations')).toBeInTheDocument();
  });

  it('should render all limitations', () => {
    render(<LimitationsSection limitations={mockLimitations} />);
    expect(screen.getByText('Lower back injury - avoid heavy deadlifts')).toBeInTheDocument();
    expect(screen.getByText('Knee issues - no deep squats')).toBeInTheDocument();
  });

  it('should render alert icons for each limitation', () => {
    render(<LimitationsSection limitations={mockLimitations} />);
    const alertIcons = screen.getAllByTestId('icon-alert');
    expect(alertIcons.length).toBeGreaterThanOrEqual(2);
  });

  it('should show empty state when no limitations', () => {
    render(<LimitationsSection limitations={[]} />);
    expect(screen.getByText('No limitations recorded')).toBeInTheDocument();
  });

  it('should show Add button', () => {
    render(<LimitationsSection limitations={mockLimitations} />);
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('should show add form when Add is clicked', () => {
    render(<LimitationsSection limitations={mockLimitations} />);
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByPlaceholderText('Enter limitation...')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should hide add form when Cancel is clicked', () => {
    render(<LimitationsSection limitations={mockLimitations} />);
    fireEvent.click(screen.getByText('Add'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Enter limitation...')).not.toBeInTheDocument();
  });

  it('should disable Save when limitation input is empty', () => {
    render(<LimitationsSection limitations={mockLimitations} />);
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('Save')).toBeDisabled();
  });
});
