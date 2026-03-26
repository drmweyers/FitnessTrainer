/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecurrenceConfig from '../RecurrenceConfig';

jest.mock('lucide-react', () => ({
  RefreshCw: (props: any) => <span data-testid="icon-refresh" {...props} />,
  Calendar: (props: any) => <span data-testid="icon-calendar" {...props} />,
  ChevronDown: (props: any) => <span data-testid="icon-chevron" {...props} />,
}));

describe('RecurrenceConfig', () => {
  const mockOnConfigChange = jest.fn();

  const defaultProps = {
    onConfigChange: mockOnConfigChange,
    startDate: new Date('2026-04-07'), // A Monday
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the recurrence toggle', () => {
    render(<RecurrenceConfig {...defaultProps} />);

    expect(screen.getByLabelText(/make this recurring/i)).toBeInTheDocument();
  });

  it('hides recurrence options when toggle is off', () => {
    render(<RecurrenceConfig {...defaultProps} />);

    expect(screen.queryByLabelText(/frequency/i)).not.toBeInTheDocument();
  });

  it('shows recurrence options when toggle is enabled', () => {
    render(<RecurrenceConfig {...defaultProps} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /make this recurring/i }));

    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
  });

  it('shows frequency options: weekly, biweekly, monthly', () => {
    render(<RecurrenceConfig {...defaultProps} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /make this recurring/i }));

    const select = screen.getByLabelText(/frequency/i);
    expect(select).toBeInTheDocument();

    const options = select.querySelectorAll('option');
    const optionValues = Array.from(options).map((o) => (o as HTMLOptionElement).value);

    expect(optionValues).toContain('weekly');
    expect(optionValues).toContain('biweekly');
    expect(optionValues).toContain('monthly');
  });

  it('shows end options after N occurrences or on date', () => {
    render(<RecurrenceConfig {...defaultProps} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /make this recurring/i }));

    expect(screen.getByLabelText(/occurrences/i)).toBeInTheDocument();
  });

  it('has default 12 occurrences', () => {
    render(<RecurrenceConfig {...defaultProps} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /make this recurring/i }));

    const occurrencesInput = screen.getByLabelText(/occurrences/i);
    expect(occurrencesInput).toHaveValue(12);
  });

  it('shows preview of next 3-5 upcoming dates', () => {
    render(<RecurrenceConfig {...defaultProps} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /make this recurring/i }));

    expect(screen.getByText(/upcoming dates/i)).toBeInTheDocument();

    // Should show at least 3 dates
    const dateItems = screen.getAllByRole('listitem');
    expect(dateItems.length).toBeGreaterThanOrEqual(3);
  });

  it('calls onConfigChange when recurring is toggled on', () => {
    render(<RecurrenceConfig {...defaultProps} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /make this recurring/i }));

    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        isRecurring: true,
        frequency: 'weekly',
        occurrences: 12,
      })
    );
  });

  it('calls onConfigChange with null when recurring is toggled off', () => {
    render(<RecurrenceConfig {...defaultProps} />);

    // Toggle on
    fireEvent.click(screen.getByRole('checkbox', { name: /make this recurring/i }));
    // Toggle off
    fireEvent.click(screen.getByRole('checkbox', { name: /make this recurring/i }));

    expect(mockOnConfigChange).toHaveBeenLastCalledWith(null);
  });

  it('calls onConfigChange when frequency changes', () => {
    render(<RecurrenceConfig {...defaultProps} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /make this recurring/i }));

    fireEvent.change(screen.getByLabelText(/frequency/i), {
      target: { value: 'biweekly' },
    });

    expect(mockOnConfigChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ frequency: 'biweekly' })
    );
  });

  it('calls onConfigChange when occurrences change', () => {
    render(<RecurrenceConfig {...defaultProps} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /make this recurring/i }));

    fireEvent.change(screen.getByLabelText(/occurrences/i), {
      target: { value: '8' },
    });

    expect(mockOnConfigChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ occurrences: 8 })
    );
  });

  it('updates preview dates when frequency changes to biweekly', async () => {
    render(<RecurrenceConfig {...defaultProps} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /make this recurring/i }));

    fireEvent.change(screen.getByLabelText(/frequency/i), {
      target: { value: 'biweekly' },
    });

    await waitFor(() => {
      expect(screen.getByText(/upcoming dates/i)).toBeInTheDocument();
    });
  });
});
