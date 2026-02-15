/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import WhatsAppButton from '../WhatsAppButton';

describe('WhatsAppButton', () => {
  it('renders inline variant with correct wa.me link', () => {
    render(<WhatsAppButton phone="+1234567890" name="Coach Sarah" />);
    const link = screen.getByRole('link', { name: /chat on whatsapp/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('wa.me/1234567890'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders floating variant', () => {
    render(<WhatsAppButton phone="+1234567890" variant="floating" />);
    const link = screen.getByLabelText('Chat on WhatsApp');
    expect(link).toHaveClass('fixed');
  });

  it('cleans phone number of spaces and dashes', () => {
    render(<WhatsAppButton phone="+1 234-567-890" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('wa.me/1234567890'));
  });

  it('includes pre-filled message with name', () => {
    render(<WhatsAppButton phone="+1234567890" name="Coach Sarah" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('text='));
    expect(link).toHaveAttribute('href', expect.stringContaining('Coach%20Sarah'));
  });

  it('includes generic message without name', () => {
    render(<WhatsAppButton phone="+1234567890" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('text='));
  });
});
