/** @jest-environment jsdom */
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock framer-motion to render all motion elements as their HTML counterparts
jest.mock('framer-motion', () => {
  const createMotionComponent = (tag: string) => {
    const Component = React.forwardRef(({ children, ...props }: any, ref: any) => {
      // Filter out framer-motion-specific props
      const {
        initial, animate, whileInView, viewport, variants, transition,
        whileHover, whileTap, exit, layout, layoutId, ...domProps
      } = props
      return React.createElement(tag, { ...domProps, ref }, children)
    })
    Component.displayName = `motion.${tag}`
    return Component
  }

  return {
    motion: {
      div: createMotionComponent('div'),
      section: createMotionComponent('section'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
      p: createMotionComponent('p'),
      span: createMotionComponent('span'),
      a: createMotionComponent('a'),
      button: createMotionComponent('button'),
      img: createMotionComponent('img'),
      ul: createMotionComponent('ul'),
      li: createMotionComponent('li'),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  )
  MockLink.displayName = 'Link'
  return { __esModule: true, default: MockLink }
})

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Dumbbell: (props: any) => <svg data-testid="icon-dumbbell" {...props} />,
  ClipboardList: (props: any) => <svg data-testid="icon-clipboard" {...props} />,
  Users: (props: any) => <svg data-testid="icon-users" {...props} />,
  Activity: (props: any) => <svg data-testid="icon-activity" {...props} />,
  BarChart3: (props: any) => <svg data-testid="icon-barchart" {...props} />,
  Zap: (props: any) => <svg data-testid="icon-zap" {...props} />,
  ChevronRight: (props: any) => <svg data-testid="icon-chevron" {...props} />,
  CheckCircle2: (props: any) => <svg data-testid="icon-check" {...props} />,
  ArrowRight: (props: any) => <svg data-testid="icon-arrow" {...props} />,
  Calendar: (props: any) => <svg data-testid="icon-calendar" {...props} />,
  Sparkles: (props: any) => <svg data-testid="icon-sparkles" {...props} />,


}))

import HomePage from '../page'

describe('HomePage', () => {
  beforeEach(() => {
    render(<HomePage />)
  })

  describe('Hero Section', () => {
    it('renders the main heading', () => {
      expect(screen.getByText(/Own Your Coaching Platform\./i)).toBeInTheDocument()
      // "Forever." appears in the h1 span, plus in body text; use getAllByText
      const foreverElements = screen.getAllByText(/Forever\./i)
      expect(foreverElements.length).toBeGreaterThanOrEqual(1)
    })

    it('renders the hero description', () => {
      expect(
        screen.getByText(/The all-in-one fitness coaching platform for personal trainers/i)
      ).toBeInTheDocument()
    })

    it('renders the logo with correct attributes', () => {
      const logos = screen.getAllByAltText('EvoFit Trainer')
      expect(logos.length).toBeGreaterThanOrEqual(1)
      expect(logos[0]).toHaveAttribute('src', '/logo.svg')
    })

    it('renders Get Started CTA linking to register', () => {
      const ctaButtons = screen.getAllByText(/Get Started/i)
      expect(ctaButtons.length).toBeGreaterThanOrEqual(1)
      const registerLink = ctaButtons.find(el => el.closest('a')?.getAttribute('href') === '/auth/register')
      expect(registerLink).toBeTruthy()
    })

    it('renders See Features button', () => {
      expect(screen.getByText('See Features')).toBeInTheDocument()
    })
  })

  describe('Features Section', () => {
    it('renders the features heading', () => {
      expect(
        screen.getByText('Everything You Need to Train Smarter')
      ).toBeInTheDocument()
    })

    it('renders the features subheading', () => {
      expect(
        screen.getByText(/From 1,344 exercise demonstrations to ACWR analytics/i)
      ).toBeInTheDocument()
    })

    it('renders all 8 feature cards', () => {
      expect(screen.getAllByText('Exercise Library').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Program Builder')).toBeInTheDocument()
      expect(screen.getByText('Client Management')).toBeInTheDocument()
      expect(screen.getByText('Workout Tracking')).toBeInTheDocument()
      expect(screen.getByText('Progress Analytics')).toBeInTheDocument()
      expect(screen.getByText('Activity Feed')).toBeInTheDocument()
      expect(screen.getByText('Scheduling & Calendar')).toBeInTheDocument()
      expect(screen.getByText('AI Workout Builder')).toBeInTheDocument()
    })

    it('renders feature descriptions', () => {
      expect(screen.getByText(/Access 1,344 professional exercises/i)).toBeInTheDocument()
      expect(screen.getByText(/Design multi-week programs with RPE/i)).toBeInTheDocument()
      expect(screen.getByText(/Manage your roster with 5 status states/i)).toBeInTheDocument()
    })
  })

  describe('Feature Spotlight Section', () => {
    it('renders the Feature Spotlight heading', () => {
      expect(screen.getByText('Feature Spotlight')).toBeInTheDocument()
    })

    it('renders Exercise Library spotlight', () => {
      expect(screen.getByText('1,344 Exercises. Zero Setup.')).toBeInTheDocument()
      expect(screen.getByText(/The Exercise Library is your complete movement database/i)).toBeInTheDocument()
    })

    it('renders Program Builder spotlight', () => {
      expect(screen.getByText('Elite Programming. Simple Interface.')).toBeInTheDocument()
      expect(screen.getByText(/The Program Builder gives you the same sophisticated/i)).toBeInTheDocument()
    })

    it('renders Analytics spotlight', () => {
      expect(screen.getByText('Pro Sports Analytics for Every Trainer')).toBeInTheDocument()
      expect(screen.getByText(/ACWR \(Acute:Chronic Workload Ratio\) monitoring/i)).toBeInTheDocument()
    })

    it('renders Client Management spotlight', () => {
      expect(screen.getByText('CRM-Level Client Organization')).toBeInTheDocument()
      expect(screen.getByText(/Your client roster is more than a list/i)).toBeInTheDocument()
    })

    it('renders Workout Tracking spotlight', () => {
      expect(screen.getByText('Every Rep Logged. Every PR Celebrated.')).toBeInTheDocument()
      expect(screen.getByText(/Real-time workout tracking that captures everything/i)).toBeInTheDocument()
    })

    it('renders Scheduling spotlight', () => {
      expect(screen.getByText('One Calendar. Every Session Type.')).toBeInTheDocument()
      expect(screen.getByText(/Manage your entire training schedule from one calendar/i)).toBeInTheDocument()
    })

    it('renders spotlight screenshots', () => {
      expect(screen.getByAltText(/EvoFit Exercise Library/i)).toBeInTheDocument()
      expect(screen.getByAltText(/EvoFit Program Builder/i)).toBeInTheDocument()
      expect(screen.getByAltText(/EvoFit Analytics Dashboard/i)).toBeInTheDocument()
      expect(screen.getByAltText(/EvoFit Client Management/i)).toBeInTheDocument()
      expect(screen.getByAltText(/EvoFit Workout Tracker/i)).toBeInTheDocument()
      expect(screen.getByAltText(/EvoFit Schedule/i)).toBeInTheDocument()
    })
  })

  describe('Benefits Section', () => {
    it('renders the benefits heading', () => {
      expect(
        screen.getByText('Built for Trainers Who Refuse to Rent')
      ).toBeInTheDocument()
    })

    it('renders all benefit items', () => {
      expect(
        screen.getByText(/1,344 exercises with animated demonstrations/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText('Build and assign programs in minutes')
      ).toBeInTheDocument()
      // "ACWR training load monitoring" appears in features, spotlight, and benefits; use exact match
      expect(
        screen.getByText('ACWR training load monitoring (pro-level analytics)')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Track every rep, set, and personal record')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Works on desktop, tablet, and mobile')
      ).toBeInTheDocument()
    })

    it('renders stats preview cards', () => {
      // Stats cards below the dashboard screenshot
      const exercisesText = screen.getAllByText('Exercises')
      expect(exercisesText.length).toBeGreaterThanOrEqual(1)
      const programTypesText = screen.getAllByText('Program Types')
      expect(programTypesText.length).toBeGreaterThanOrEqual(1)
      const setTypesText = screen.getAllByText('Set Types')
      expect(setTypesText.length).toBeGreaterThanOrEqual(1)
      const musclesText = screen.getAllByText('Muscles')
      expect(musclesText.length).toBeGreaterThanOrEqual(1)
    })

    it('renders the dashboard screenshot', () => {
      expect(screen.getByAltText(/EvoFit Trainer Dashboard/i)).toBeInTheDocument()
    })
  })

  describe('Social Proof / Stats Section', () => {
    it('renders the social proof heading', () => {
      expect(
        screen.getByText('Professional-Grade Tools You Own Outright')
      ).toBeInTheDocument()
    })

    it('renders the social proof description', () => {
      expect(
        screen.getByText(/Trusted by trainers who demand professional-grade tools/i)
      ).toBeInTheDocument()
    })

    it('renders stat numbers', () => {
      // 1,344 appears in multiple places (stats, feature cards, benefits, pricing)
      const stat1344 = screen.getAllByText('1,344')
      expect(stat1344.length).toBeGreaterThanOrEqual(2)

      const stat8 = screen.getAllByText('8')
      expect(stat8.length).toBeGreaterThanOrEqual(1)

      const stat7 = screen.getAllByText('7')
      expect(stat7.length).toBeGreaterThanOrEqual(1)

      const stat26 = screen.getAllByText('26')
      expect(stat26.length).toBeGreaterThanOrEqual(1)
    })

    it('renders stat labels', () => {
      expect(screen.getAllByText('Exercises Included').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Target Muscles').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Roles Section', () => {
    it('renders the roles heading', () => {
      expect(
        screen.getByText('One Platform, Three Perspectives')
      ).toBeInTheDocument()
    })

    it('renders the roles subheading', () => {
      expect(
        screen.getByText(/Tailored dashboards and tools for every role/i)
      ).toBeInTheDocument()
    })

    it('renders all three role cards', () => {
      expect(screen.getByText('Administrator')).toBeInTheDocument()
      expect(screen.getByText('Trainer')).toBeInTheDocument()
      expect(screen.getByText('Client')).toBeInTheDocument()
    })

    it('renders role subtitles', () => {
      expect(screen.getByText('Full Control')).toBeInTheDocument()
      expect(screen.getByText('Build and Coach')).toBeInTheDocument()
      expect(screen.getByText('Train and Improve')).toBeInTheDocument()
    })

    it('shows Most Popular badge on Trainer card', () => {
      expect(screen.getByText('Most Popular')).toBeInTheDocument()
    })

    it('renders role feature lists', () => {
      expect(screen.getByText('Platform analytics dashboard')).toBeInTheDocument()
      expect(screen.getByText('Client roster management')).toBeInTheDocument()
      expect(screen.getByText('Real-time workout logging')).toBeInTheDocument()
    })
  })

  describe('CTA Section', () => {
    it('renders the final CTA heading', () => {
      expect(
        screen.getByText('Ready to Level Up Your Coaching?')
      ).toBeInTheDocument()
    })

    it('renders the final CTA description', () => {
      expect(
        screen.getByText(/Join trainers who use EvoFit to build better programs/i)
      ).toBeInTheDocument()
    })

    it('renders CTA buttons', () => {
      const ctaButtons = screen.getAllByText(/Get Started/i)
      expect(ctaButtons.length).toBeGreaterThanOrEqual(2)

      expect(screen.getByText('Sign In to Dashboard')).toBeInTheDocument()
    })

    it('renders Sign In to Dashboard linking to login', () => {
      const signInDashboard = screen.getByText('Sign In to Dashboard')
      const link = signInDashboard.closest('a')
      expect(link).toHaveAttribute('href', '/auth/login')
    })
  })

  describe('Footer', () => {
    it('renders the footer logo and company name', () => {
      const logos = screen.getAllByAltText('EvoFit Trainer')
      expect(logos.length).toBeGreaterThanOrEqual(2) // Hero + Footer
    })

    it('renders footer section headings', () => {
      expect(screen.getByText('Platform')).toBeInTheDocument()
      expect(screen.getByText('Account')).toBeInTheDocument()
    })

    it('renders platform links in footer', () => {
      const exerciseLinks = screen.getAllByText('Exercise Library')
      expect(exerciseLinks.length).toBeGreaterThanOrEqual(2) // feature card + footer
      expect(screen.getByText('Programs')).toBeInTheDocument()
      expect(screen.getByText('Workouts')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
    })

    it('renders account links in footer', () => {
      const getStartedLinks = screen.getAllByText(/Get Started/i)
      expect(getStartedLinks.length).toBeGreaterThanOrEqual(2)

      // "Sign In" appears in footer
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('renders copyright notice', () => {
      const currentYear = new Date().getFullYear()
      expect(
        screen.getByText(new RegExp(`${currentYear} EvoFit Trainer`))
      ).toBeInTheDocument()
    })

    it('renders footer description', () => {
      expect(
        screen.getByText(/Build programs, track progress, grow your business/i)
      ).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('renders proper alt text for all images', () => {
      const images = screen.getAllByRole('img')
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt')
      })
    })

    it('renders proper heading hierarchy', () => {
      const h1Elements = screen.getAllByRole('heading', { level: 1 })
      expect(h1Elements.length).toBeGreaterThan(0)

      const h2Elements = screen.getAllByRole('heading', { level: 2 })
      expect(h2Elements.length).toBeGreaterThan(0)

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
