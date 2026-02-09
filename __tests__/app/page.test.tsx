/** @jest-environment jsdom */

import React from 'react'
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // Filter out Next.js-specific props
    const { priority, unoptimized, ...imgProps } = props
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...imgProps} />
  },
}))

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  },
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    ul: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Dumbbell: () => <div data-testid="icon-dumbbell" />,
  ClipboardList: () => <div data-testid="icon-clipboard" />,
  Users: () => <div data-testid="icon-users" />,
  Activity: () => <div data-testid="icon-activity" />,
  BarChart3: () => <div data-testid="icon-barchart" />,
  Zap: () => <div data-testid="icon-zap" />,
  ChevronRight: () => <div data-testid="icon-chevron" />,
  CheckCircle2: () => <div data-testid="icon-check" />,
  ArrowRight: () => <div data-testid="icon-arrow" />,
}))

describe('HomePage', () => {
  beforeEach(() => {
    render(<HomePage />)
  })

  describe('Hero Section', () => {
    it('renders the main heading', () => {
      expect(screen.getByText(/Transform Your/i)).toBeInTheDocument()
      expect(screen.getByText(/Fitness Business/i)).toBeInTheDocument()
    })

    it('renders the hero description', () => {
      expect(
        screen.getByText(/The all-in-one platform for personal trainers/i)
      ).toBeInTheDocument()
    })

    it('renders the logo with correct attributes', () => {
      const logos = screen.getAllByAltText('EvoFit Trainer')
      expect(logos.length).toBeGreaterThan(0)
      const heroLogo = logos[0]
      expect(heroLogo).toHaveAttribute('src', '/logo.png')
      expect(heroLogo).toHaveAttribute('width', '72')
      expect(heroLogo).toHaveAttribute('height', '72')
    })

    it('renders CTA buttons with correct links', () => {
      const getStartedButtons = screen.getAllByText(/Get Started Free/i)
      expect(getStartedButtons.length).toBeGreaterThan(0)
      expect(getStartedButtons[0].closest('a')).toHaveAttribute('href', '/auth/register')

      const signInButtons = screen.getAllByText(/Sign In/i)
      expect(signInButtons.length).toBeGreaterThan(0)
      // Find the one in the hero section (not footer)
      const heroSignIn = signInButtons.find((btn) => {
        const parent = btn.closest('a')
        return parent?.getAttribute('href') === '/auth/login'
      })
      expect(heroSignIn).toBeTruthy()
    })
  })

  describe('Features Section', () => {
    it('renders the features heading', () => {
      expect(screen.getByText(/Everything You Need to Train Smarter/i)).toBeInTheDocument()
    })

    it('renders all 6 feature cards', () => {
      // Use getAllByText since some appear in footer too
      const exerciseLibrary = screen.getAllByText('Exercise Library')
      expect(exerciseLibrary.length).toBeGreaterThanOrEqual(1)

      expect(screen.getByText('Program Builder')).toBeInTheDocument()
      expect(screen.getByText('Client Management')).toBeInTheDocument()
      expect(screen.getByText('Workout Tracking')).toBeInTheDocument()
      expect(screen.getByText('Progress Analytics')).toBeInTheDocument()
      expect(screen.getByText('Activity Feed')).toBeInTheDocument()
    })

    it('renders feature descriptions', () => {
      expect(screen.getByText(/Access 1,300\+ exercises/i)).toBeInTheDocument()
      expect(screen.getByText(/Design multi-week training programs/i)).toBeInTheDocument()
      expect(screen.getByText(/Manage your roster of clients/i)).toBeInTheDocument()
    })

    it('renders feature icons', () => {
      expect(screen.getByTestId('icon-dumbbell')).toBeInTheDocument()
      expect(screen.getByTestId('icon-clipboard')).toBeInTheDocument()
      expect(screen.getByTestId('icon-users')).toBeInTheDocument()
      expect(screen.getByTestId('icon-activity')).toBeInTheDocument()
      expect(screen.getByTestId('icon-barchart')).toBeInTheDocument()
      expect(screen.getByTestId('icon-zap')).toBeInTheDocument()
    })
  })

  describe('Benefits Section', () => {
    it('renders the benefits heading', () => {
      expect(screen.getByText(/Built for Trainers, By Trainers/i)).toBeInTheDocument()
    })

    it('renders all benefit items', () => {
      expect(screen.getByText(/Manage unlimited clients from one dashboard/i)).toBeInTheDocument()
      expect(screen.getByText(/Build and assign programs in minutes/i)).toBeInTheDocument()
      expect(screen.getByText(/Track every rep, set, and personal record/i)).toBeInTheDocument()
      expect(screen.getByText(/Monitor client progress with analytics/i)).toBeInTheDocument()
      expect(screen.getByText(/Works on desktop, tablet, and mobile/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Secure JWT authentication and role-based access/i)
      ).toBeInTheDocument()
    })

    it('renders stats preview cards', () => {
      expect(screen.getByText('Active Clients')).toBeInTheDocument()
      expect(screen.getByText('24')).toBeInTheDocument()
      expect(screen.getByText('Workouts This Week')).toBeInTheDocument()
      expect(screen.getByText('47')).toBeInTheDocument()
      expect(screen.getByText('Programs Active')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('Exercises')).toBeInTheDocument()
      expect(screen.getByText('1,300+')).toBeInTheDocument()
    })
  })

  describe('Roles Section', () => {
    it('renders the roles heading', () => {
      expect(screen.getByText(/One Platform, Three Perspectives/i)).toBeInTheDocument()
    })

    it('renders all three role cards', () => {
      expect(screen.getByText('Administrator')).toBeInTheDocument()
      expect(screen.getByText('Trainer')).toBeInTheDocument()
      expect(screen.getByText('Client')).toBeInTheDocument()
    })

    it('renders role descriptions', () => {
      expect(screen.getByText(/Full Control/i)).toBeInTheDocument()
      expect(screen.getByText(/Build and Coach/i)).toBeInTheDocument()
      expect(screen.getByText(/Train and Improve/i)).toBeInTheDocument()
    })

    it('highlights Trainer role as most popular', () => {
      expect(screen.getByText('Most Popular')).toBeInTheDocument()
    })
  })

  describe('CTA Section', () => {
    it('renders the final CTA heading', () => {
      expect(screen.getByText(/Ready to Elevate Your Training/i)).toBeInTheDocument()
    })

    it('renders CTA buttons', () => {
      expect(screen.getByText('Create Your Account')).toBeInTheDocument()
      expect(screen.getByText('Sign In to Dashboard')).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('renders the footer logo and company name', () => {
      const footerLogos = screen.getAllByAltText('EvoFit Trainer')
      expect(footerLogos.length).toBeGreaterThan(1) // Hero + Footer
      const footerText = screen.getAllByText('EvoFit Trainer')
      expect(footerText.length).toBeGreaterThan(0)
    })

    it('renders platform links', () => {
      expect(screen.getByText('Platform')).toBeInTheDocument()
      // Use getAllByText since these appear in multiple places
      const exerciseLinks = screen.getAllByText('Exercise Library')
      expect(exerciseLinks.length).toBeGreaterThan(1) // Feature card + footer link
    })

    it('renders account links', () => {
      expect(screen.getByText('Account')).toBeInTheDocument()
      const signUpLinks = screen.getAllByText('Sign Up')
      expect(signUpLinks.length).toBeGreaterThan(0)
    })

    it('renders copyright notice', () => {
      const currentYear = new Date().getFullYear()
      expect(
        screen.getByText(new RegExp(`© ${currentYear} EvoFit Trainer`, 'i'))
      ).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('renders proper alt text for all images', () => {
      const images = screen.getAllByAltText('EvoFit Trainer')
      expect(images.length).toBeGreaterThan(0)
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt')
      })
    })

    it('renders proper heading hierarchy', () => {
      // Check that h1 exists
      const h1Elements = screen.getAllByRole('heading', { level: 1 })
      expect(h1Elements.length).toBeGreaterThan(0)

      // Check that h2 headings exist
      const h2Elements = screen.getAllByRole('heading', { level: 2 })
      expect(h2Elements.length).toBeGreaterThan(0)

      // Check that h3 headings exist
      const h3Elements = screen.getAllByRole('heading', { level: 3 })
      expect(h3Elements.length).toBeGreaterThan(0)
    })

    it('renders all links with proper href attributes', () => {
      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link).toHaveAttribute('href')
      })
    })
  })
})
