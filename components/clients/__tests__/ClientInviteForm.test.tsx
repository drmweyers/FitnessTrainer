/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClientInviteForm from '../ClientInviteForm';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  Mail: (props: any) => <span data-testid="icon-mail" {...props} />,
  Send: (props: any) => <span data-testid="icon-send" {...props} />,
  UserPlus: (props: any) => <span data-testid="icon-userplus" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
}));

describe('ClientInviteForm', () => {
  const defaultProps = {
    onSubmit: jest.fn().mockResolvedValue(undefined),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the form title', () => {
      render(<ClientInviteForm {...defaultProps} />);
      expect(screen.getByText('Invite New Client')).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      render(<ClientInviteForm {...defaultProps} />);
      expect(screen.getByText('Send a personalized invitation to join your training program')).toBeInTheDocument();
    });

    it('renders email input field', () => {
      render(<ClientInviteForm {...defaultProps} />);
      expect(screen.getByPlaceholderText('client@example.com')).toBeInTheDocument();
    });

    it('renders custom message textarea', () => {
      render(<ClientInviteForm {...defaultProps} />);
      expect(screen.getByPlaceholderText('Add a personal touch to your invitation...')).toBeInTheDocument();
    });

    it('renders character count for custom message', () => {
      render(<ClientInviteForm {...defaultProps} />);
      expect(screen.getByText('0/500')).toBeInTheDocument();
    });

    it('renders Preview Invitation button', () => {
      render(<ClientInviteForm {...defaultProps} />);
      expect(screen.getByText('Preview Invitation')).toBeInTheDocument();
    });

    it('renders Send Invitation button', () => {
      render(<ClientInviteForm {...defaultProps} />);
      expect(screen.getByText('Send Invitation')).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      render(<ClientInviteForm {...defaultProps} />);
      // There are 2 cancel buttons - X and text Cancel
      const cancelButtons = screen.getAllByText('Cancel');
      expect(cancelButtons.length).toBeGreaterThan(0);
    });

    it('renders tip about personalized messages', () => {
      render(<ClientInviteForm {...defaultProps} />);
      expect(screen.getByText(/Personalized messages get better response rates/)).toBeInTheDocument();
    });
  });

  describe('Email Input', () => {
    it('updates email field when typed', () => {
      render(<ClientInviteForm {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput.value).toBe('test@example.com');
    });

    it('disables Preview Invitation when email is empty', () => {
      render(<ClientInviteForm {...defaultProps} />);
      const previewButton = screen.getByText('Preview Invitation');
      expect(previewButton.closest('button')).toBeDisabled();
    });

    it('enables Preview Invitation when email is entered', () => {
      render(<ClientInviteForm {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      const previewButton = screen.getByText('Preview Invitation');
      expect(previewButton.closest('button')).not.toBeDisabled();
    });

    it('disables Send Invitation when email is empty', () => {
      render(<ClientInviteForm {...defaultProps} />);
      // Find the Send Invitation button in the footer
      const sendButtons = screen.getAllByText('Send Invitation');
      const footerSendButton = sendButtons[sendButtons.length - 1];
      expect(footerSendButton.closest('button')).toBeDisabled();
    });
  });

  describe('Custom Message', () => {
    it('updates custom message when typed', () => {
      render(<ClientInviteForm {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Add a personal touch to your invitation...');
      fireEvent.change(textarea, { target: { value: 'Welcome aboard!' } });
      expect(screen.getByText('15/500')).toBeInTheDocument();
    });
  });

  describe('Cancel', () => {
    it('calls onCancel when Cancel button is clicked', () => {
      render(<ClientInviteForm {...defaultProps} />);
      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.click(cancelButtons[0]);
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('calls onCancel when X button is clicked', () => {
      render(<ClientInviteForm {...defaultProps} />);
      // The X icon button in the header
      const xIcons = screen.getAllByTestId('icon-x');
      const closeButton = xIcons[0].closest('button');
      expect(closeButton).toBeTruthy();
      fireEvent.click(closeButton!);
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('Preview Mode', () => {
    it('shows preview when Preview Invitation is clicked', () => {
      render(<ClientInviteForm {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Preview Invitation'));
      expect(screen.getByText('Email Preview')).toBeInTheDocument();
      expect(screen.getByText('Edit Message')).toBeInTheDocument();
    });

    it('shows email recipient in preview', () => {
      render(<ClientInviteForm {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Preview Invitation'));
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    });

    it('shows subject line in preview', () => {
      render(<ClientInviteForm {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Preview Invitation'));
      expect(screen.getByText(/Invitation to Join Your Personal Training Program/)).toBeInTheDocument();
    });

    it('returns to form when Edit Message is clicked', () => {
      render(<ClientInviteForm {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Preview Invitation'));
      expect(screen.getByText('Email Preview')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Edit Message'));
      expect(screen.queryByText('Email Preview')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('client@example.com')).toBeInTheDocument();
    });

    it('shows Accept Invitation button in preview', () => {
      render(<ClientInviteForm {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(screen.getByText('Preview Invitation'));
      expect(screen.getByText('Accept Invitation')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with form data', async () => {
      render(<ClientInviteForm {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      const sendButtons = screen.getAllByText('Send Invitation');
      fireEvent.click(sendButtons[sendButtons.length - 1]);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({
          clientEmail: 'test@example.com',
          customMessage: '',
        });
      });
    });

    it('shows error when email is empty on submit', async () => {
      render(<ClientInviteForm {...defaultProps} />);
      // Hack: make the button not disabled by setting email first then clearing
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'a' } });
      fireEvent.change(emailInput, { target: { value: '' } });
      // Force submit via form
      const form = document.querySelector('form');
      if (form) {
        fireEvent.submit(form);
        await waitFor(() => {
          expect(screen.getByText('Email address is required')).toBeInTheDocument();
        });
      }
    });

    it('shows error when email has no @ sign', async () => {
      render(<ClientInviteForm {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
      const form = document.querySelector('form');
      if (form) {
        fireEvent.submit(form);
        await waitFor(() => {
          expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
        });
      }
    });

    it('clears error when user starts typing after error', async () => {
      render(<ClientInviteForm {...defaultProps} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
      const form = document.querySelector('form');
      if (form) {
        fireEvent.submit(form);
        await waitFor(() => {
          expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
        });
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      }
    });

    it('shows error when onSubmit throws', async () => {
      const failingSubmit = jest.fn().mockRejectedValue(new Error('Server error'));
      render(<ClientInviteForm {...defaultProps} onSubmit={failingSubmit} />);
      const emailInput = screen.getByPlaceholderText('client@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      const sendButtons = screen.getAllByText('Send Invitation');
      fireEvent.click(sendButtons[sendButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });
});
