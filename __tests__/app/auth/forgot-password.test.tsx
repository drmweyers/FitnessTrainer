/** @jest-environment jsdom */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordPage from '@/app/auth/forgot-password/page';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('ForgotPasswordPage - Disabled State', () => {
  it('should render the page with EvoFit branding', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByText('EvoFit')).toBeInTheDocument();
    expect(screen.getByText('Reset your password')).toBeInTheDocument();
  });

  it('should show informative message that feature is unavailable', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByText('Password reset functionality is currently unavailable')).toBeInTheDocument();
    expect(screen.getByText('Password Reset Not Available')).toBeInTheDocument();
  });

  it('should display support email contact', () => {
    render(<ForgotPasswordPage />);

    const supportLink = screen.getByText('support@evofit.io');
    expect(supportLink.closest('a')).toHaveAttribute('href', 'mailto:support@evofit.io');
  });

  it('should have disabled submit button', () => {
    render(<ForgotPasswordPage />);

    const submitButton = screen.getByText('Reset Unavailable');
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute('title', 'Password reset is not yet available');
  });

  it('should have email input field', () => {
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email address');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
  });

  it('should have back to sign in link', () => {
    render(<ForgotPasswordPage />);

    const backLinks = screen.getAllByText('Back to sign in');
    expect(backLinks.length).toBeGreaterThan(0);
    backLinks.forEach(link => {
      expect(link.closest('a')).toHaveAttribute('href', '/auth/login');
    });
  });

  it('should show informative blue info box', () => {
    render(<ForgotPasswordPage />);

    const infoText = screen.getByText(/We're currently setting up our password reset system/i);
    expect(infoText).toBeInTheDocument();
  });

  it('should show disabled state and not process form', () => {
    render(<ForgotPasswordPage />);

    const submitButton = screen.getByText('Reset Unavailable');

    // Button should be disabled
    expect(submitButton).toBeDisabled();
  });

  it('should allow email input but not submit', () => {
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('Email address');

    // User can type email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput).toHaveValue('test@example.com');

    // But button is disabled
    const submitButton = screen.getByText('Reset Unavailable');
    expect(submitButton).toBeDisabled();
  });
});
