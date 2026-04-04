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
      form: createMotionComponent('form'),
      nav: createMotionComponent('nav'),
      header: createMotionComponent('header'),
      footer: createMotionComponent('footer'),
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

// Mock next/image
jest.mock('next/image', () => {
  const MockImage = ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  )
  MockImage.displayName = 'Image'
  return { __esModule: true, default: MockImage }
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
  Clock: (props: any) => <svg data-testid="icon-clock" {...props} />,
  TrendingUp: (props: any) => <svg data-testid="icon-trending-up" {...props} />,
  Star: (props: any) => <svg data-testid="icon-star" {...props} />,
  Menu: (props: any) => <svg data-testid="icon-menu" {...props} />,
  X: (props: any) => <svg data-testid="icon-x" {...props} />,
  Shield: (props: any) => <svg data-testid="icon-shield" {...props} />,
  Trophy: (props: any) => <svg data-testid="icon-trophy" {...props} />,
  Target: (props: any) => <svg data-testid="icon-target" {...props} />,
  MessageSquare: (props: any) => <svg data-testid="icon-message" {...props} />,
  Brain: (props: any) => <svg data-testid="icon-brain" {...props} />,
}))

import HomePage from '../page'

describe('HomePage', () => {
  beforeEach(() => {
    render(<HomePage />)
  })

  describe('Hero Section', () => {
    it('renders the main heading', () => {
      const headings = screen.getAllByText(/Scale Your Training Business/i)
      expect(headings.length).toBeGreaterThanOrEqual(1)
      const burnoutElements = screen.getAllByText(/Without Burnout/i)
      expect(burnoutElements.length).toBeGreaterThanOrEqual(1)
    })

    it('renders the hero description', () => {
      expect(
        screen.getByText(/Stop writing workout programs from scratch/i)
      ).toBeInTheDocument()
    })

    it('renders Get Lifetime Access CTA linking to pricing', () => {
      const ctaLinks = screen.getAllByRole('link')
      const pricingCta = ctaLinks.find(el => el.textContent?.includes('Get Lifetime Access') && el.getAttribute('href') === '/pricing')
      expect(pricingCta).toBeTruthy()
    })

    it('renders See How It Works button', () => {
      expect(screen.getByText('See How It Works')).toBeInTheDocument()
    })
  })

  describe('Pain Points Section', () => {
    it('renders the pain points heading', () => {
      expect(
        screen.getByText('Still Programming Workouts Manually?')
      ).toBeInTheDocument()
    })

    it('renders time stat', () => {
      expect(screen.getByText('3-5 hours')).toBeInTheDocument()
      expect(screen.getByText('per client')).toBeInTheDocument()
    })
  })

  describe('Solution Section', () => {
    it('renders the solution heading', () => {
      expect(
        screen.getByText(/EvoFit Trainer: The Complete Platform/i)
      ).toBeInTheDocument()
    })
  })

  describe('Features Section', () => {
    it('renders the features heading', () => {
      expect(
        screen.getByText('Everything You Need in One Platform')
      ).toBeInTheDocument()
    })

    it('renders key feature headings', () => {
      expect(screen.getByText('Build Programs in Minutes, Not Hours')).toBeInTheDocument()
      expect(screen.getByText('Professional Exercise Database at Your Fingertips')).toBeInTheDocument()
      expect(screen.getByText("Track Every Client's Progress Effortlessly")).toBeInTheDocument()
      expect(screen.getByText('See Which Programs Drive Results')).toBeInTheDocument()
      expect(screen.getByText(/Let AI Handle Your Program Variations/i)).toBeInTheDocument()
    })

    it('renders feature images', () => {
      expect(screen.getByAltText(/Program builder interface/i)).toBeInTheDocument()
      expect(screen.getByAltText(/Exercise library with search/i)).toBeInTheDocument()
      expect(screen.getByAltText(/Client management dashboard/i)).toBeInTheDocument()
    })
  })

  describe('Social Proof Section', () => {
    it('renders stat numbers', () => {
      expect(screen.getByText('500+')).toBeInTheDocument()
      expect(screen.getByText('1,200+')).toBeInTheDocument()
      expect(screen.getByText('15,000+')).toBeInTheDocument()
      expect(screen.getByText('94%')).toBeInTheDocument()
    })

    it('renders stat labels', () => {
      expect(screen.getByText('Exercises')).toBeInTheDocument()
      expect(screen.getByText('Trainers')).toBeInTheDocument()
      expect(screen.getByText('Programs Created')).toBeInTheDocument()
      expect(screen.getByText('Time Savings')).toBeInTheDocument()
    })

    it('renders testimonials', () => {
      expect(screen.getByText(/Sarah Chen/i)).toBeInTheDocument()
      expect(screen.getByText(/Marcus Rodriguez/i)).toBeInTheDocument()
      expect(screen.getByText(/Jennifer Park/i)).toBeInTheDocument()
    })

    it('renders testimonial quotes', () => {
      expect(screen.getByText(/EvoFit Trainer cut my programming time/i)).toBeInTheDocument()
    })
  })

  describe('Pricing Section', () => {
    it('renders the pricing heading', () => {
      expect(screen.getByText('Choose Your Growth Plan')).toBeInTheDocument()
    })

    it('renders pricing tiers', () => {
      expect(screen.getByText('Starter')).toBeInTheDocument()
      expect(screen.getByText('Enterprise')).toBeInTheDocument()
      expect(screen.getByText('SaaS')).toBeInTheDocument()
    })

    it('renders pricing CTA links', () => {
      expect(screen.getByText('Get Professional Access')).toBeInTheDocument()
      expect(screen.getByText('Get Enterprise Access')).toBeInTheDocument()
      expect(screen.getByText('Start Free Trial')).toBeInTheDocument()
    })
  })

  describe('CTA Section', () => {
    it('renders the final CTA heading', () => {
      expect(
        screen.getByText("Ready to 3x Your Client Capacity?")
      ).toBeInTheDocument()
    })

    it('renders the final CTA description', () => {
      expect(
        screen.getByText(/Join 1,200\+ trainers who've reclaimed their weekends/i)
      ).toBeInTheDocument()
    })

    it('renders CTA form with email input', () => {
      expect(screen.getByPlaceholderText('Your email address')).toBeInTheDocument()
      expect(screen.getByText('Get Lifetime Access Now')).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('renders footer brand name', () => {
      const brandNames = screen.getAllByText('EvoFit Trainer')
      expect(brandNames.length).toBeGreaterThanOrEqual(1)
    })

    it('renders footer section headings', () => {
      expect(screen.getByText('Platform')).toBeInTheDocument()
      expect(screen.getByText('Account')).toBeInTheDocument()
      expect(screen.getByText('Company')).toBeInTheDocument()
    })

    it('renders platform links in footer', () => {
      const featuresLinks = screen.getAllByText('Features')
      expect(featuresLinks.length).toBeGreaterThanOrEqual(1)
      const pricingLinks = screen.getAllByText('Pricing')
      expect(pricingLinks.length).toBeGreaterThanOrEqual(1)
      const exerciseLinks = screen.getAllByText('Exercise Library')
      expect(exerciseLinks.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Program Templates')).toBeInTheDocument()
    })

    it('renders account links in footer', () => {
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
      expect(screen.getByText('Log In')).toBeInTheDocument()
      expect(screen.getByText('Support')).toBeInTheDocument()
    })

    it('renders copyright notice', () => {
      const currentYear = new Date().getFullYear()
      expect(
        screen.getByText(new RegExp(`${currentYear} EvoFit Trainer`))
      ).toBeInTheDocument()
    })

    it('renders footer description', () => {
      expect(
        screen.getByText(/Scale your training business without burnout/i)
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
