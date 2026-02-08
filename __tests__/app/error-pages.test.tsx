/** @jest-environment jsdom */

import { render, screen, fireEvent } from '@testing-library/react';
import NotFound from '@/app/not-found';
import Error from '@/app/error';
import GlobalError from '@/app/global-error';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
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
    const mockError = new Error('Test error message');
    const mockReset = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      // Suppress console.error for tests
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      (console.error as jest.Mock).mockRestore();
    });

    it('should render error message', () => {
      render(<Error error={mockError} reset={mockReset} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render EvoFit branding', () => {
      render(<Error error={mockError} reset={mockReset} />);

      expect(screen.getByText('EvoFit')).toBeInTheDocument();
    });

    it('should have try again button that calls reset', () => {
      render(<Error error={mockError} reset={mockReset} />);

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalled();
    });

    it('should have dashboard link', () => {
      render(<Error error={mockError} reset={mockReset} />);

      const dashboardLink = screen.getByText('Go to Dashboard');
      expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');
    });

    it('should log error on mount', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');

      render(<Error error={mockError} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', mockError);
    });

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(<Error error={mockError} reset={mockReset} />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('GlobalError (Root Error Boundary)', () => {
    const mockError = new Error('Critical error');
    const mockReset = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      // Suppress console.error for tests
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      (console.error as jest.Mock).mockRestore();
    });

    it('should render critical error message', () => {
      render(<GlobalError error={mockError} reset={mockReset} />);

      expect(screen.getByText('Critical Error')).toBeInTheDocument();
    });

    it('should have try again button', () => {
      render(<GlobalError error={mockError} reset={mockReset} />);

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalled();
    });

    it('should have dashboard link', () => {
      render(<GlobalError error={mockError} reset={mockReset} />);

      const dashboardLink = screen.getByText('Go to Dashboard');
      expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');
    });

    it('should log error on mount', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');

      render(<GlobalError error={mockError} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Global error:', mockError);
    });

    it('should render own html and body tags', () => {
      const { container } = render(<GlobalError error={mockError} reset={mockReset} />);

      // GlobalError should render <html> and <body> tags
      const html = container.querySelector('html');
      const body = container.querySelector('body');

      expect(html).toBeInTheDocument();
      expect(body).toBeInTheDocument();
    });
  });
});
