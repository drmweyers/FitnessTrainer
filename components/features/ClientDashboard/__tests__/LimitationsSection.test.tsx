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

  it('should enable Save when limitation input has content', () => {
    render(<LimitationsSection limitations={mockLimitations} />);
    fireEvent.click(screen.getByText('Add'));
    const input = screen.getByPlaceholderText('Enter limitation...');
    fireEvent.change(input, { target: { value: 'New limitation' } });
    expect(screen.getByText('Save')).not.toBeDisabled();
  });

  it('should disable Save when limitation input contains only whitespace', () => {
    render(<LimitationsSection limitations={mockLimitations} />);
    fireEvent.click(screen.getByText('Add'));
    const input = screen.getByPlaceholderText('Enter limitation...');
    fireEvent.change(input, { target: { value: '   ' } });
    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('should update input value when typing', () => {
    render(<LimitationsSection limitations={mockLimitations} />);
    fireEvent.click(screen.getByText('Add'));
    const input = screen.getByPlaceholderText('Enter limitation...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Shoulder mobility issues' } });
    expect(input.value).toBe('Shoulder mobility issues');
  });

  it('should clear input and hide form when Save is clicked', () => {
    render(<LimitationsSection limitations={mockLimitations} />);
    fireEvent.click(screen.getByText('Add'));
    const input = screen.getByPlaceholderText('Enter limitation...');
    fireEvent.change(input, { target: { value: 'New limitation' } });
    fireEvent.click(screen.getByText('Save'));
    expect(screen.queryByPlaceholderText('Enter limitation...')).not.toBeInTheDocument();
  });

  it('should show Plus icon in Add button', () => {
    render(<LimitationsSection limitations={mockLimitations} />);
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument();
  });

  it('should not show add form initially', () => {
    render(<LimitationsSection limitations={mockLimitations} />);
    expect(screen.queryByPlaceholderText('Enter limitation...')).not.toBeInTheDocument();
  });

  it('should render single limitation correctly', () => {
    const singleLimitation = [{ id: '1', text: 'Wrist pain during push-ups' }];
    render(<LimitationsSection limitations={singleLimitation} />);
    expect(screen.getByText('Wrist pain during push-ups')).toBeInTheDocument();
  });

  it('should show alert icon in empty state', () => {
    render(<LimitationsSection limitations={[]} />);
    const alertIcons = screen.getAllByTestId('icon-alert');
    expect(alertIcons.length).toBeGreaterThanOrEqual(1);
  });
});
