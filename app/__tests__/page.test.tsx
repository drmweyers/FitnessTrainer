/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>{children}</div>
    )),
    h1: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <h1 ref={ref} {...props}>{children}</h1>
    )),
    h2: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <h2 ref={ref} {...props}>{children}</h2>
    )),
    p: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <p ref={ref} {...props}>{children}</p>
    )),
    ul: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <ul ref={ref} {...props}>{children}</ul>
    )),
    li: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <li ref={ref} {...props}>{children}</li>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import HomePage from '../page';

describe('HomePage', () => {
  beforeEach(() => {
    render(<HomePage />);
  });

  describe('Hero Section', () => {
    it('should render the main tagline', () => {
      expect(screen.getByText(/Transform Your/)).toBeInTheDocument();
      expect(screen.getByText(/Fitness Business/)).toBeInTheDocument();
    });

    it('should render the subtitle text', () => {
      expect(
        screen.getByText(/all-in-one platform for personal trainers/i)
      ).toBeInTheDocument();
    });

    it('should render the logo image', () => {
      const logo = screen.getAllByAltText('EvoFit Trainer');
      expect(logo.length).toBeGreaterThanOrEqual(1);
      expect(logo[0]).toHaveAttribute('src', '/logo.png');
    });

    it('should render Get Started Free button linking to register', () => {
      const ctaButtons = screen.getAllByText('Get Started Free');
      expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
      const link = ctaButtons[0].closest('a');
      expect(link).toHaveAttribute('href', '/auth/register');
    });

    it('should render Sign In button linking to login', () => {
      const signInLinks = screen.getAllByText('Sign In');
      expect(signInLinks.length).toBeGreaterThanOrEqual(1);
      const link = signInLinks[0].closest('a');
      expect(link).toHaveAttribute('href', '/auth/login');
    });
  });

  describe('Features Section', () => {
    it('should render the features heading', () => {
      expect(
        screen.getByText('Everything You Need to Train Smarter')
      ).toBeInTheDocument();
    });

    it('should render all 6 feature cards', () => {
      // Some feature names also appear in the footer, so use getAllByText
      expect(screen.getAllByText('Exercise Library').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Program Builder')).toBeInTheDocument();
      expect(screen.getByText('Client Management')).toBeInTheDocument();
      expect(screen.getByText('Workout Tracking')).toBeInTheDocument();
      expect(screen.getByText('Progress Analytics')).toBeInTheDocument();
      expect(screen.getByText('Activity Feed')).toBeInTheDocument();
    });

    it('should render feature descriptions', () => {
      expect(screen.getByText(/1,300\+ exercises with detailed/)).toBeInTheDocument();
      expect(screen.getByText(/multi-week training programs/i)).toBeInTheDocument();
      expect(screen.getByText(/roster of clients/i)).toBeInTheDocument();
    });
  });

  describe('Benefits Section', () => {
    it('should render the benefits heading', () => {
      expect(
        screen.getByText('Built for Trainers, By Trainers')
      ).toBeInTheDocument();
    });

    it('should render benefit items', () => {
      expect(
        screen.getByText('Manage unlimited clients from one dashboard')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Build and assign programs in minutes')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Track every rep, set, and personal record')
      ).toBeInTheDocument();
    });

    it('should render stats preview cards', () => {
      expect(screen.getByText('Active Clients')).toBeInTheDocument();
      expect(screen.getByText('Workouts This Week')).toBeInTheDocument();
      expect(screen.getByText('Programs Active')).toBeInTheDocument();
      expect(screen.getByText('1,300+')).toBeInTheDocument();
    });
  });

  describe('Roles Section', () => {
    it('should render the roles heading', () => {
      expect(
        screen.getByText('One Platform, Three Perspectives')
      ).toBeInTheDocument();
    });

    it('should render all three role cards', () => {
      expect(screen.getByText('Administrator')).toBeInTheDocument();
      expect(screen.getByText('Trainer')).toBeInTheDocument();
      expect(screen.getByText('Client')).toBeInTheDocument();
    });

    it('should render role descriptions', () => {
      expect(screen.getByText('Full Control')).toBeInTheDocument();
      expect(screen.getByText('Build and Coach')).toBeInTheDocument();
      expect(screen.getByText('Train and Improve')).toBeInTheDocument();
    });

    it('should show Most Popular badge on Trainer card', () => {
      expect(screen.getByText('Most Popular')).toBeInTheDocument();
    });
  });

  describe('CTA Section', () => {
    it('should render the CTA heading', () => {
      expect(
        screen.getByText('Ready to Elevate Your Training?')
      ).toBeInTheDocument();
    });

    it('should render Create Your Account button', () => {
      const button = screen.getByText('Create Your Account');
      const link = button.closest('a');
      expect(link).toHaveAttribute('href', '/auth/register');
    });

    it('should render Sign In to Dashboard button', () => {
      const button = screen.getByText('Sign In to Dashboard');
      const link = button.closest('a');
      expect(link).toHaveAttribute('href', '/auth/login');
    });
  });

  describe('Footer', () => {
    it('should render the footer with copyright', () => {
      const year = new Date().getFullYear().toString();
      expect(
        screen.getByText(new RegExp(`${year} EvoFit Trainer`))
      ).toBeInTheDocument();
    });

    it('should render platform links in footer', () => {
      // "Exercise Library" appears in both the feature cards and footer
      // Use getAllByText and verify multiple instances exist
      const exerciseLibraryLinks = screen.getAllByText('Exercise Library');
      expect(exerciseLibraryLinks.length).toBeGreaterThanOrEqual(2); // feature card + footer

      // Footer-specific link: "Sign Up" only appears in footer
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should render footer section headings', () => {
      expect(screen.getByText('Platform')).toBeInTheDocument();
      expect(screen.getByText('Account')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not use the legacy Layout component', () => {
      // The page should render directly without a Layout wrapper
      // Check there's no double navigation or double footer
      const navElements = screen.queryAllByTestId('main-navigation');
      expect(navElements.length).toBe(0); // No AppLayout nav since it's not in this test
    });
  });
});
