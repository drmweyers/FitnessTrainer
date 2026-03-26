/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import DeloadConfig from '../DeloadConfig';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

const mockOnConfigChange = jest.fn();

beforeEach(() => {
  mockOnConfigChange.mockClear();
});

describe('DeloadConfig', () => {
  it('renders the component', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    expect(screen.getByTestId('deload-config')).toBeInTheDocument();
  });

  it('renders the enable deload toggle', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    expect(screen.getByRole('checkbox', { name: /enable automatic deload/i })).toBeInTheDocument();
  });

  it('is disabled by default', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    const toggle = screen.getByRole('checkbox', { name: /enable automatic deload/i });
    expect(toggle).not.toBeChecked();
  });

  it('hides configuration options when disabled', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    expect(screen.queryByLabelText(/frequency/i)).not.toBeInTheDocument();
  });

  it('shows configuration options when enabled', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    const toggle = screen.getByRole('checkbox', { name: /enable automatic deload/i });
    fireEvent.click(toggle);
    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
  });

  it('renders frequency dropdown when enabled', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /enable automatic deload/i }));
    const select = screen.getByLabelText(/frequency/i);
    expect(select).toBeInTheDocument();
    // Should have options 3, 4, 5, 6
    expect(screen.getByRole('option', { name: 'Every 3 weeks' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Every 4 weeks' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Every 5 weeks' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Every 6 weeks' })).toBeInTheDocument();
  });

  it('renders intensity reduction slider when enabled', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /enable automatic deload/i }));
    expect(screen.getByLabelText(/deload intensity/i)).toBeInTheDocument();
  });

  it('renders volume reduction slider when enabled', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /enable automatic deload/i }));
    expect(screen.getByLabelText(/deload volume/i)).toBeInTheDocument();
  });

  it('shows preview text when enabled', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /enable automatic deload/i }));
    expect(screen.getByTestId('deload-preview')).toBeInTheDocument();
  });

  it('preview text mentions the deload week', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /enable automatic deload/i }));
    const preview = screen.getByTestId('deload-preview');
    // Default frequency is every 4 weeks, so week 4 will be deload
    expect(preview).toHaveTextContent(/week 4/i);
  });

  it('default intensity is 40%', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /enable automatic deload/i }));
    const intensitySlider = screen.getByLabelText(/deload intensity/i);
    expect(intensitySlider).toHaveValue('40');
  });

  it('default volume is 50%', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /enable automatic deload/i }));
    const volumeSlider = screen.getByLabelText(/deload volume/i);
    expect(volumeSlider).toHaveValue('50');
  });

  it('calls onConfigChange when toggled', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /enable automatic deload/i }));
    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true })
    );
  });

  it('calls onConfigChange when frequency changes', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /enable automatic deload/i }));
    const select = screen.getByLabelText(/frequency/i);
    fireEvent.change(select, { target: { value: '6' } });
    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ frequencyWeeks: 6 })
    );
  });

  it('calls onConfigChange when intensity slider changes', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /enable automatic deload/i }));
    const slider = screen.getByLabelText(/deload intensity/i);
    fireEvent.change(slider, { target: { value: '50' } });
    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ intensityReduction: 50 })
    );
  });

  it('calls onConfigChange when volume slider changes', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /enable automatic deload/i }));
    const slider = screen.getByLabelText(/deload volume/i);
    fireEvent.change(slider, { target: { value: '35' } });
    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ volumeReduction: 35 })
    );
  });

  it('renders with initialConfig when provided', () => {
    render(
      <DeloadConfig
        onConfigChange={mockOnConfigChange}
        initialConfig={{ enabled: true, frequencyWeeks: 5, intensityReduction: 45, volumeReduction: 55 }}
      />
    );
    const toggle = screen.getByRole('checkbox', { name: /enable automatic deload/i });
    expect(toggle).toBeChecked();
    expect(screen.getByLabelText(/frequency/i)).toHaveValue('5');
  });

  it('slider intensity has correct min and max', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /enable automatic deload/i }));
    const slider = screen.getByLabelText(/deload intensity/i);
    expect(slider).toHaveAttribute('min', '30');
    expect(slider).toHaveAttribute('max', '60');
  });

  it('slider volume has correct min and max', () => {
    render(<DeloadConfig onConfigChange={mockOnConfigChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /enable automatic deload/i }));
    const slider = screen.getByLabelText(/deload volume/i);
    expect(slider).toHaveAttribute('min', '30');
    expect(slider).toHaveAttribute('max', '60');
  });

  it('preview text reflects custom intensity and volume values', () => {
    render(
      <DeloadConfig
        onConfigChange={mockOnConfigChange}
        initialConfig={{ enabled: true, frequencyWeeks: 4, intensityReduction: 60, volumeReduction: 50 }}
      />
    );
    const preview = screen.getByTestId('deload-preview');
    expect(preview).toHaveTextContent(/60%/);
    expect(preview).toHaveTextContent(/50%/);
  });
});
