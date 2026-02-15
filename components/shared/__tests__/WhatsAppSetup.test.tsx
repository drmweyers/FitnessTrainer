/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WhatsAppSetup from '../WhatsAppSetup';

describe('WhatsAppSetup', () => {
  const mockOnSave = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders WhatsApp setup form', () => {
    render(<WhatsAppSetup onSave={mockOnSave} />);
    expect(screen.getByText('WhatsApp Integration')).toBeInTheDocument();
    expect(screen.getByLabelText('WhatsApp Number')).toBeInTheDocument();
    expect(screen.getByText('Save WhatsApp Number')).toBeInTheDocument();
  });

  it('shows current number if provided', () => {
    render(<WhatsAppSetup currentNumber="+1234567890" onSave={mockOnSave} />);
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
  });

  it('shows validation error for invalid number', async () => {
    render(<WhatsAppSetup onSave={mockOnSave} />);
    fireEvent.change(screen.getByLabelText('WhatsApp Number'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Save WhatsApp Number'));
    expect(await screen.findByRole('alert')).toHaveTextContent(/valid international phone/i);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('calls onSave with valid number', async () => {
    render(<WhatsAppSetup onSave={mockOnSave} />);
    fireEvent.change(screen.getByLabelText('WhatsApp Number'), { target: { value: '+1234567890' } });
    fireEvent.click(screen.getByText('Save WhatsApp Number'));
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('+1234567890');
    });
    expect(screen.getByRole('status')).toHaveTextContent(/saved successfully/i);
  });

  it('shows preview URL when number entered', () => {
    render(<WhatsAppSetup onSave={mockOnSave} />);
    fireEvent.change(screen.getByLabelText('WhatsApp Number'), { target: { value: '+1234567890' } });
    expect(screen.getByText('wa.me/1234567890')).toBeInTheDocument();
  });

  it('allows clearing the number', async () => {
    render(<WhatsAppSetup currentNumber="+1234567890" onSave={mockOnSave} />);
    fireEvent.change(screen.getByLabelText('WhatsApp Number'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Save WhatsApp Number'));
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('');
    });
  });

  it('shows error on save failure', async () => {
    mockOnSave.mockRejectedValueOnce(new Error('Network error'));
    render(<WhatsAppSetup onSave={mockOnSave} />);
    fireEvent.change(screen.getByLabelText('WhatsApp Number'), { target: { value: '+1234567890' } });
    fireEvent.click(screen.getByText('Save WhatsApp Number'));
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to save/i);
  });
});
