/** @jest-environment jsdom */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientArchiveDialog from '../ClientArchiveDialog';
import { Button } from '@/components/ui/button';

describe('ClientArchiveDialog', () => {
  it('renders trigger button', () => {
    const mockConfirm = jest.fn();
    render(
      <ClientArchiveDialog
        clientName="John Doe"
        onConfirm={mockConfirm}
        trigger={<Button>Archive</Button>}
      />
    );
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', () => {
    const mockConfirm = jest.fn();
    render(
      <ClientArchiveDialog
        clientName="John Doe"
        onConfirm={mockConfirm}
        trigger={<Button>Archive</Button>}
      />
    );

    fireEvent.click(screen.getByText('Archive'));
    expect(screen.getByText(/archive client/i)).toBeInTheDocument();
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });

  it('allows entering a reason', () => {
    const mockConfirm = jest.fn();
    render(
      <ClientArchiveDialog
        clientName="Jane Smith"
        onConfirm={mockConfirm}
        trigger={<Button>Archive</Button>}
      />
    );

    fireEvent.click(screen.getByText('Archive'));
    const textarea = screen.getByPlaceholderText(/client moved/i);
    fireEvent.change(textarea, { target: { value: 'Client relocated' } });
    expect(textarea).toHaveValue('Client relocated');
  });

  it('calls onConfirm with reason when confirmed', () => {
    const mockConfirm = jest.fn();
    render(
      <ClientArchiveDialog
        clientName="Test Client"
        onConfirm={mockConfirm}
        trigger={<Button>Archive</Button>}
      />
    );

    fireEvent.click(screen.getByText('Archive'));
    const textarea = screen.getByPlaceholderText(/client moved/i);
    fireEvent.change(textarea, { target: { value: 'Test reason' } });

    fireEvent.click(screen.getByRole('button', { name: /archive client/i }));
    expect(mockConfirm).toHaveBeenCalledWith('Test reason');
  });

  it('resets reason when canceled', () => {
    const mockConfirm = jest.fn();
    render(
      <ClientArchiveDialog
        clientName="Test Client"
        onConfirm={mockConfirm}
        trigger={<Button>Archive</Button>}
      />
    );

    fireEvent.click(screen.getByText('Archive'));
    const textarea = screen.getByPlaceholderText(/client moved/i);
    fireEvent.change(textarea, { target: { value: 'Test reason' } });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockConfirm).not.toHaveBeenCalled();
  });
});
