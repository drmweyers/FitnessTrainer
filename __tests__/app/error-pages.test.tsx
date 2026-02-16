/** @jest-environment jsdom */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import NotFound from '@/app/not-found';

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'Link';
  return MockLink;
});

describe('Error Pages', () => {
  describe('NotFound (404 Page)', () => {
    it('should render 404 message', () => {
      render(<NotFound />);

      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });

    it('should render EvoFit branding', () => {
      render(<NotFound />);

      expect(screen.getByText('EvoFit')).toBeInTheDocument();
    });

    it('should have link to dashboard', () => {
      render(<NotFound />);

      const dashboardLink = screen.getByText('Go to Dashboard');
      expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');
    });

    it('should have go back button', () => {
      const mockBack = jest.fn();
      window.history.back = mockBack;

      render(<NotFound />);

      const goBackButton = screen.getByText('Go Back');
      fireEvent.click(goBackButton);

      expect(mockBack).toHaveBeenCalled();
    });

    it('should have support link', () => {
      render(<NotFound />);

      const supportLink = screen.getByText('Contact support');
      expect(supportLink.closest('a')).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Error (Runtime Error Boundary)', () => {
    const mockError = new window.Error('Test error message');
    const mockReset = jest.fn();
    let ErrorPage: any;

    beforeAll(async () => {
      ErrorPage = (await import('@/app/error')).default;
    });

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      (console.error as jest.Mock).mockRestore();
    });

    it('should render error message', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render EvoFit branding', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(screen.getByText('EvoFit')).toBeInTheDocument();
    });

    it('should have try again button that calls reset', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalled();
    });

    it('should have dashboard link', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const dashboardLink = screen.getByText('Go to Dashboard');
      expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');
    });

    it('should log error on mount', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');

      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', mockError);
    });

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('GlobalError (Root Error Boundary)', () => {
    const mockError = new window.Error('Critical error');
    const mockReset = jest.fn();
    let GlobalErrorPage: any;

    beforeAll(async () => {
      GlobalErrorPage = (await import('@/app/global-error')).default;
    });

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      (console.error as jest.Mock).mockRestore();
    });

    it('should render critical error message', () => {
      render(<GlobalErrorPage error={mockError} reset={mockReset} />);

      expect(screen.getByText('Critical Error')).toBeInTheDocument();
    });

    it('should have try again button', () => {
      render(<GlobalErrorPage error={mockError} reset={mockReset} />);

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalled();
    });

    it('should have dashboard link', () => {
      render(<GlobalErrorPage error={mockError} reset={mockReset} />);

      const dashboardLink = screen.getByText('Go to Dashboard');
      expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');
    });

    it('should log error on mount', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');

      render(<GlobalErrorPage error={mockError} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Global error:', mockError);
    });

    it('should render own html and body tags', () => {
      const { container } = render(<GlobalErrorPage error={mockError} reset={mockReset} />);

      const html = container.querySelector('html');
      const body = container.querySelector('body');

      expect(html).toBeInTheDocument();
      expect(body).toBeInTheDocument();
    });
  });
});
