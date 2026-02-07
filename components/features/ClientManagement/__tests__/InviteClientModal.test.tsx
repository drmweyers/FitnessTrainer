/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
  Mail: () => <span data-testid="icon-mail" />,
  Send: () => <span data-testid="icon-send" />,
  UserPlus: () => <span data-testid="icon-user-plus" />,
  Users: () => <span data-testid="icon-users" />,
  CheckCircle: () => <span data-testid="icon-check-circle" />,
}));

import InviteClientModal from '../InviteClientModal';

describe('InviteClientModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onInvite: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Closed state', () => {
    it('should render nothing when isOpen is false', () => {
      const { container } = render(
        <InviteClientModal isOpen={false} onClose={jest.fn()} onInvite={jest.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Form step', () => {
    it('should render the modal title', () => {
      render(<InviteClientModal {...defaultProps} />);
      expect(screen.getByText('Invite New Client')).toBeInTheDocument();
    });

    it('should render email input', () => {
      render(<InviteClientModal {...defaultProps} />);
      expect(screen.getByPlaceholderText('client@example.com')).toBeInTheDocument();
    });

    it('should render email label', () => {
      render(<InviteClientModal {...defaultProps} />);
      expect(screen.getByText('Client Email Address *')).toBeInTheDocument();
    });

    it('should render custom message textarea', () => {
      render(<InviteClientModal {...defaultProps} />);
      expect(screen.getByPlaceholderText('Add a personal touch to your invitation...')).toBeInTheDocument();
    });

    it('should render Preview & Send button', () => {
      render(<InviteClientModal {...defaultProps} />);
      expect(screen.getByText('Preview & Send')).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      render(<InviteClientModal {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should disable Preview & Send when email is empty', () => {
      render(<InviteClientModal {...defaultProps} />);
      const previewBtn = screen.getByText('Preview & Send');
      expect(previewBtn).toBeDisabled();
    });

    it('should enable Preview & Send when email is filled', () => {
      render(<InviteClientModal {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      const previewBtn = screen.getByText('Preview & Send');
      expect(previewBtn).not.toBeDisabled();
    });

    it('should show character count for custom message', () => {
      render(<InviteClientModal {...defaultProps} />);
      expect(screen.getByText('0/500')).toBeInTheDocument();
    });

    it('should update character count when message is typed', () => {
      render(<InviteClientModal {...defaultProps} />);
      const messageInput = screen.getByPlaceholderText('Add a personal touch to your invitation...');
      fireEvent.change(messageInput, { target: { value: 'Hello there!' } });
      expect(screen.getByText('12/500')).toBeInTheDocument();
    });

    it('should call onClose when Cancel is clicked', () => {
      render(<InviteClientModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when X button is clicked', () => {
      render(<InviteClientModal {...defaultProps} />);
      const xIcon = screen.getAllByTestId('icon-x');
      const closeBtn = xIcon[0].closest('button');
      if (closeBtn) {
        fireEvent.click(closeBtn);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Preview step', () => {
    function goToPreview() {
      render(<InviteClientModal {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Preview & Send'));
    }

    it('should show email preview when Preview & Send is clicked', () => {
      goToPreview();
      expect(screen.getByText('Email Preview')).toBeInTheDocument();
    });

    it('should show the email recipient in preview', () => {
      goToPreview();
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    });

    it('should show Edit Message button', () => {
      goToPreview();
      expect(screen.getByText('Edit Message')).toBeInTheDocument();
    });

    it('should show Send Invitation button', () => {
      goToPreview();
      expect(screen.getByText('Send Invitation')).toBeInTheDocument();
    });

    it('should go back to form when Edit Message is clicked', () => {
      goToPreview();
      fireEvent.click(screen.getByText('Edit Message'));
      expect(screen.getByText('Preview & Send')).toBeInTheDocument();
    });

    it('should show default message in preview when no custom message', () => {
      goToPreview();
      expect(screen.getByText(/I'd like to invite you to join my personal training program/)).toBeInTheDocument();
    });

    it('should show custom message in preview when provided', () => {
      render(<InviteClientModal {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      const messageInput = screen.getByPlaceholderText('Add a personal touch to your invitation...');
      fireEvent.change(messageInput, { target: { value: 'Custom welcome message!' } });
      fireEvent.click(screen.getByText('Preview & Send'));
      expect(screen.getByText('Custom welcome message!')).toBeInTheDocument();
    });
  });

  describe('Send invitation', () => {
    it('should call onInvite when Send Invitation is clicked', async () => {
      render(<InviteClientModal {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Preview & Send'));

      await act(async () => {
        fireEvent.click(screen.getByText('Send Invitation'));
      });

      await waitFor(() => {
        expect(defaultProps.onInvite).toHaveBeenCalledWith('test@example.com', undefined);
      });
    });

    it('should show success step after successful invite', async () => {
      render(<InviteClientModal {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Preview & Send'));

      await act(async () => {
        fireEvent.click(screen.getByText('Send Invitation'));
      });

      await waitFor(() => {
        expect(screen.getByText('Invitation Sent Successfully!')).toBeInTheDocument();
      });
    });

    it('should show error when invitation fails', async () => {
      const failingProps = {
        ...defaultProps,
        onInvite: jest.fn().mockRejectedValue(new Error('Server error')),
      };
      render(<InviteClientModal {...failingProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Preview & Send'));

      await act(async () => {
        fireEvent.click(screen.getByText('Send Invitation'));
      });

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('should show error for invalid email when submitting from preview', async () => {
      render(<InviteClientModal {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(screen.getByText('Preview & Send'));

      // Now click Send Invitation
      await act(async () => {
        fireEvent.click(screen.getByText('Send Invitation'));
      });

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });
  });

  describe('Success step', () => {
    async function goToSuccess() {
      render(<InviteClientModal {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Preview & Send'));

      await act(async () => {
        fireEvent.click(screen.getByText('Send Invitation'));
      });

      await waitFor(() => {
        expect(screen.getByText('Invitation Sent Successfully!')).toBeInTheDocument();
      });
    }

    it('should show the sent email address', async () => {
      await goToSuccess();
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    });

    it('should show Send Another Invitation button', async () => {
      await goToSuccess();
      expect(screen.getByText('Send Another Invitation')).toBeInTheDocument();
    });

    it('should show Done button', async () => {
      await goToSuccess();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('should reset form when Send Another Invitation is clicked', async () => {
      await goToSuccess();
      fireEvent.click(screen.getByText('Send Another Invitation'));
      expect(screen.getByText('Preview & Send')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('client@example.com')).toHaveValue('');
    });

    it('should close modal when Done is clicked', async () => {
      await goToSuccess();
      fireEvent.click(screen.getByText('Done'));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
