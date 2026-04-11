'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView, useAnimation } from 'framer-motion'
import {
  Dumbbell,
  ClipboardList,
  Users,
  Activity,
  BarChart3,
  Calendar,
  Check,
  X,
  Star,
  ArrowRight,
  Shield,
  Zap,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Target,
  Trophy,
  Clock,
} from 'lucide-react'

/* ─── Animation Variants ─────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

/* ─── Animated Counter Hook ─────────────────────── */
function useCounter(end: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (!inView) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, end, duration])

  return { count, ref }
}

/* ─── Scroll Reveal Wrapper ─────────────────────── */
function Reveal({
  children,
  variants = fadeUp,
  className = '',
}: {
  children: React.ReactNode
  variants?: typeof fadeUp
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const controls = useAnimation()

  useEffect(() => {
    if (inView) controls.start('visible')
  }, [inView, controls])

  return (
    <motion.div ref={ref} initial="hidden" animate={controls} variants={variants} className={className}>
      {children}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════
   HERO SECTION
═══════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Dark background */}
      <div className="absolute inset-0 bg-[#0A0A0F]" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Blue radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-600/15 rounded-full blur-[180px]" />

      {/* Orange accent glow top-right */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-500/8 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-8">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-200 font-medium">
              No monthly fees · No per-client charges · Own it forever
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-[80px] leading-[1.05] text-white mb-6 tracking-tight">
            Own Your Coaching
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
              Platform.
            </span>{' '}
            <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              Forever.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            The all-in-one fitness coaching platform for personal trainers.{' '}
            <span className="text-white font-semibold">Save $5,700+</span> over 5 years vs.
            subscription tools like Everfit and TrueCoach.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#pricing">
              <button className="group inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-[1.02]">
                See Pricing
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </a>
            <Link href="/register">
              <button className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/8 backdrop-blur-sm font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-300">
                Start Free
                <ArrowRight className="w-5 h-5 opacity-60" />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Floating stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto"
        >
          {[
            { value: '1,344', label: 'Exercises' },
            { value: '$199', label: 'One-time' },
            { value: '0', label: 'Monthly fees' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-bold text-2xl sm:text-3xl text-white">{stat.value}</div>
              <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Dashboard screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-16 relative max-w-5xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-900/30">
            <Image
              src="/images/marketing/trainer-dashboard.png"
              alt="EvoFit Trainer Dashboard"
              width={1200}
              height={675}
              className="w-full object-cover"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   PROBLEM SECTION
═══════════════════════════════════════════════════ */
function ProblemSection() {
  return (
    <section className="py-20 sm:py-28 bg-[#0D0D14]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-red-400 uppercase tracking-widest mb-3">
              The Problem
            </span>
            <h2 className="font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
              Subscription Software Is
              <br />
              <span className="text-red-400">Eating Your Margins</span>
            </h2>
          </div>
        </Reveal>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        >
          {[
            {
              icon: <DollarSign className="w-7 h-7" />,
              title: 'Paying $150/month for software',
              desc: "Everfit, TrueCoach, TrainHeroic — they all charge monthly, and the fees compound. $1,800/year, every year, forever. That's $9,000 over 5 years just to access your own clients.",
              color: 'text-red-400',
              bg: 'bg-red-500/10 border border-red-500/20',
            },
            {
              icon: <AlertTriangle className="w-7 h-7" />,
              title: 'Scattered across spreadsheets',
              desc: "Google Sheets for programs. Notion for client notes. WhatsApp for check-ins. There's no single source of truth and every new client means another copy-paste nightmare.",
              color: 'text-orange-400',
              bg: 'bg-orange-500/10 border border-orange-500/20',
            },
            {
              icon: <TrendingUp className="w-7 h-7" />,
              title: 'Per-client fees eating margins',
              desc: 'The more successful you are, the more you pay. Land 20 clients? Your software bill doubles. TrueCoach charges per active client — growth becomes a penalty.',
              color: 'text-yellow-400',
              bg: 'bg-yellow-500/10 border border-yellow-500/20',
            },
          ].map((pain) => (
            <motion.div key={pain.title} variants={fadeUp}>
              <div className={`rounded-2xl p-8 h-full ${pain.bg}`}>
                <div
                  className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5 ${pain.color}`}
                >
                  {pain.icon}
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">{pain.title}</h3>
                <p className="text-gray-400 leading-relaxed">{pain.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   SOLUTION SECTION
═══════════════════════════════════════════════════ */
function SolutionSection() {
  return (
    <section className="py-20 sm:py-28 bg-[#0A0A0F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Copy */}
          <Reveal className="order-2 lg:order-1">
            <span className="inline-block text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4">
              The Solution
            </span>
            <h2 className="font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-6">
              One platform.
              <br />
              One payment.
              <br />
              <span className="text-blue-400">Forever yours.</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              EvoFit Trainer gives you every tool a professional coach needs — exercise library,
              program builder, client management, analytics, and scheduling — for a single one-time
              payment. No subscriptions. No per-client fees. No renewal emails.
            </p>
            <ul className="space-y-3">
              {[
                '1,344 exercises with animated GIF demonstrations',
                'Build programs with RPE, tempo, and 7 set types',
                'Manage unlimited clients with CRM-level organization',
                'ACWR training load monitoring used by pro sports teams',
                'Works offline — log workouts without Wi-Fi',
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Right: Screenshot */}
          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-600/10 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src="/images/marketing/trainer-dashboard.png"
                  alt="EvoFit Trainer Dashboard"
                  width={700}
                  height={450}
                  className="w-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   STATS COUNTER SECTION
═══════════════════════════════════════════════════ */
function StatsSection() {
  const exercises = useCounter(1344)
  const muscles = useCounter(26)
  const programTypes = useCounter(8)
  const setTypes = useCounter(7)

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-[#0D0D14] to-[#0A0A0F] border-t border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-12">
            Built for serious coaches
          </p>
        </Reveal>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12"
        >
          {[
            { ref: exercises.ref, count: exercises.count, label: 'Exercises', suffix: '' },
            { ref: muscles.ref, count: muscles.count, label: 'Target Muscles', suffix: '' },
            { ref: programTypes.ref, count: programTypes.count, label: 'Program Types', suffix: '' },
            { ref: setTypes.ref, count: setTypes.count, label: 'Set Types', suffix: '' },
          ].map((stat, i) => (
            <motion.div key={i} variants={scaleIn} className="text-center">
              <div className="font-extrabold text-4xl sm:text-5xl text-white mb-2">
                <span ref={stat.ref}>{stat.count.toLocaleString()}</span>
                {stat.suffix}
              </div>
              <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
              <div className="mt-3 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   FEATURES SECTION
═══════════════════════════════════════════════════ */
function FeaturesSection() {
  const features = [
    {
      icon: Dumbbell,
      title: 'Exercise Library',
      description:
        '1,344 exercises with animated GIF demonstrations, 29 equipment filters, 26 target muscles, and instant full-text search.',
      screenshot: '/images/marketing/exercises-library.png',
      color: 'from-blue-600/20 to-blue-600/5',
      accent: 'text-blue-400',
      border: 'border-blue-500/20',
    },
    {
      icon: ClipboardList,
      title: 'Program Builder',
      description:
        '8 program types, 7 set types, RPE/RIR/tempo prescriptions, superset support, and deload weeks. Elite S&C-level programming.',
      screenshot: '/images/marketing/program-builder.png',
      color: 'from-green-600/20 to-green-600/5',
      accent: 'text-green-400',
      border: 'border-green-500/20',
    },
    {
      icon: Users,
      title: 'Client Management',
      description:
        'Unlimited clients, 5-state lifecycle tracking, color-coded tags, private notes, and bulk operations. CRM built for coaches.',
      screenshot: '/images/marketing/clients-list.png',
      color: 'from-purple-600/20 to-purple-600/5',
      accent: 'text-purple-400',
      border: 'border-purple-500/20',
    },
    {
      icon: Activity,
      title: 'Workout Tracking',
      description:
        'Real-time logging, automatic PR detection with confetti, rest timers, offline-first via IndexedDB, and adherence scoring.',
      screenshot: '/images/marketing/workout-tracker.png',
      color: 'from-orange-600/20 to-orange-600/5',
      accent: 'text-orange-400',
      border: 'border-orange-500/20',
    },
    {
      icon: BarChart3,
      title: 'Progress Analytics',
      description:
        'ACWR training load monitoring, 8 metric types, AI-powered insights, milestone achievements, and PDF/CSV export reports.',
      screenshot: '/images/marketing/analytics-overview.png',
      color: 'from-indigo-600/20 to-indigo-600/5',
      accent: 'text-indigo-400',
      border: 'border-indigo-500/20',
    },
    {
      icon: Calendar,
      title: 'Scheduling',
      description:
        '5 appointment types, configurable availability, online session links, iCal export, and subscribable calendar feeds.',
      screenshot: '/images/marketing/schedule-calendar.png',
      color: 'from-pink-600/20 to-pink-600/5',
      accent: 'text-pink-400',
      border: 'border-pink-500/20',
    },
  ]

  return (
    <section id="features" className="py-20 sm:py-28 bg-[#0D0D14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-blue-400 uppercase tracking-widest mb-3">
              Everything you need
            </span>
            <h2 className="font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
              Built for professional coaches.
              <br />
              <span className="text-blue-400">Priced for real business.</span>
            </h2>
          </div>
        </Reveal>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => {
            const Icon = f.icon
            return (
              <motion.div key={f.title} variants={fadeUp}>
                <div
                  className={`rounded-2xl border ${f.border} bg-gradient-to-b ${f.color} overflow-hidden h-full flex flex-col`}
                >
                  {/* Screenshot thumbnail */}
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={f.screenshot}
                      alt={f.title}
                      fill
                      className="object-cover object-top opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                  </div>
                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div
                      className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 ${f.accent}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">{f.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed flex-1">{f.description}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   TIER COMPARISON (PRICING) SECTION
═══════════════════════════════════════════════════ */
function TierComparisonSection() {
  const tiers = [
    {
      name: 'Starter',
      price: '$199',
      tagline: 'Own your platform forever.',
      description: 'Perfect for solo trainers and coaches just getting started.',
      href: '/pricing',
      color: 'border-gray-700',
      badge: null,
      cta: 'Get Started',
      ctaStyle: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
      highlights: [
        'Up to 5 active clients',
        '1,344 exercises with GIF demos',
        'Set-by-set workout logging',
        'Automatic PR detection',
        'Body composition tracking',
        'PWA — add to home screen',
      ],
    },
    {
      name: 'Professional',
      price: '$299',
      tagline: 'Run a real coaching business.',
      description: 'Unlimited clients, full program builder, ACWR analytics.',
      href: '/pricing',
      color: 'border-blue-500/60',
      badge: 'Most Popular',
      cta: 'Go Professional',
      ctaStyle:
        'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50',
      highlights: [
        'Unlimited active clients',
        '8 program types + 7 set types',
        'RPE / RIR / Tempo prescriptions',
        'ACWR training load monitoring',
        'iCal export + calendar subscribe',
        'PDF/CSV analytics reports',
      ],
    },
    {
      name: 'Enterprise',
      price: '$399',
      tagline: 'Platform control for operators.',
      description: 'Admin dashboard, audit logs, and multi-trainer management.',
      href: '/pricing',
      color: 'border-orange-500/40',
      badge: null,
      cta: 'Get Enterprise',
      ctaStyle:
        'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50',
      highlights: [
        'Everything in Professional',
        'Admin dashboard + user management',
        'Feature flags API',
        'Security audit trail',
        'Bulk user operations',
        'System health monitoring',
      ],
    },
  ]

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-[#0A0A0F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-orange-400 uppercase tracking-widest mb-3">
              Simple pricing
            </span>
            <h2 className="font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
              Pay once.{' '}
              <span className="text-orange-400">Own forever.</span>
            </h2>
            <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
              No monthly fees. No per-client charges. No renewal emails. Pick a tier and it&apos;s
              yours for life.
            </p>
          </div>
        </Reveal>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {tiers.map((tier) => (
            <motion.div key={tier.name} variants={scaleIn} className="relative">
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-block bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-blue-600/40">
                    {tier.badge}
                  </span>
                </div>
              )}
              <div
                className={`rounded-2xl border-2 ${tier.color} bg-white/[0.03] backdrop-blur-sm p-8 h-full flex flex-col`}
              >
                <div>
                  <h3 className="font-bold text-xl text-white mb-1">{tier.name}</h3>
                  <p className="text-gray-500 text-sm mb-6">{tier.description}</p>
                  <div className="mb-6">
                    <span className="font-extrabold text-4xl text-white">{tier.price}</span>
                    <span className="text-gray-500 ml-2 text-sm">one-time</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{h}</span>
                    </li>
                  ))}
                </ul>
                <Link href={tier.href}>
                  <button
                    className={`w-full py-3 rounded-xl font-bold text-base transition-all duration-200 hover:scale-[1.02] ${tier.ctaStyle}`}
                  >
                    {tier.cta}
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   COMPETITOR COMPARISON TABLE
═══════════════════════════════════════════════════ */
function CompetitorTable() {
  const features = [
    { label: 'One-time pricing', evofit: true, everfit: false, truecoach: false, trainheroic: false },
    { label: 'No per-client fee', evofit: true, everfit: false, truecoach: false, trainheroic: 'Varies' },
    { label: 'Exercise library', evofit: '1,344', everfit: '~1,000', truecoach: '~1,000', trainheroic: '~7,000*' },
    { label: 'ACWR training load', evofit: true, everfit: 'Optional', truecoach: false, trainheroic: true },
    { label: 'RPE + RIR + Tempo', evofit: true, everfit: true, truecoach: 'Partial', trainheroic: true },
    { label: 'iCal / calendar export', evofit: true, everfit: 'Partial', truecoach: false, trainheroic: false },
    { label: 'Offline workout logging', evofit: true, everfit: false, truecoach: false, trainheroic: false },
    { label: 'AI progression suggestions', evofit: 'Add-on', everfit: false, truecoach: false, trainheroic: 'Manual' },
    { label: 'Monthly cost', evofit: '$0', everfit: '$80-199', truecoach: '$19-150', trainheroic: '$35-75' },
  ]

  function Cell({ value }: { value: boolean | string }) {
    if (value === true) return <Check className="w-5 h-5 text-green-400 mx-auto" />
    if (value === false) return <X className="w-5 h-5 text-red-400/60 mx-auto" />
    return <span className="text-gray-300 text-sm">{value}</span>
  }

  return (
    <section className="py-20 sm:py-28 bg-[#0D0D14]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-blue-400 uppercase tracking-widest mb-3">
              How we compare
            </span>
            <h2 className="font-bold text-3xl sm:text-4xl text-white leading-tight">
              Same tools. <span className="text-blue-400">Never a subscription.</span>
            </h2>
          </div>
        </Reveal>

        <Reveal>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="text-left py-4 px-5 text-gray-400 font-medium w-[35%]">Feature</th>
                  <th className="py-4 px-3 text-center">
                    <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      EvoFit
                    </span>
                  </th>
                  <th className="py-4 px-3 text-center text-gray-500 font-medium">Everfit</th>
                  <th className="py-4 px-3 text-center text-gray-500 font-medium">TrueCoach</th>
                  <th className="py-4 px-3 text-center text-gray-500 font-medium hidden sm:table-cell">TrainHeroic</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr
                    key={f.label}
                    className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}
                  >
                    <td className="py-3.5 px-5 text-gray-300">{f.label}</td>
                    <td className="py-3.5 px-3 text-center font-semibold">
                      <Cell value={f.evofit} />
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Cell value={f.everfit} />
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Cell value={f.truecoach} />
                    </td>
                    <td className="py-3.5 px-3 text-center hidden sm:table-cell">
                      <Cell value={f.trainheroic} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-600 text-center">
            *TrainHeroic exercise library is athlete/team focused. Monthly cost ranges sourced from public pricing pages, March 2026.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "I was paying $120/month for Everfit. Switched to EvoFit, paid $299 once. I broke even in 5 weeks and now every client I add is pure profit. The ACWR analytics alone are worth the price — my clients think I have a PhD in sports science.",
      name: 'Marcus D.',
      title: 'Online Strength Coach, 23 clients',
      stars: 5,
    },
    {
      quote:
        "The program builder is elite-level. RPE prescriptions, deload weeks, tempo notations — I can build a 16-week powerlifting block in 20 minutes. My clients get professional programming and I own the platform. Can't go back to spreadsheets.",
      name: 'Sarah K.',
      title: 'Powerlifting Coach & CSCS',
      stars: 5,
    },
    {
      quote:
        "As a gym owner with 4 trainers, Enterprise at $399 was an obvious call. Admin dashboard, activity logs, feature flags — I can see everything happening on the platform. One trainer tried to tell me he'd done a session he hadn't. The audit log said otherwise.",
      name: 'Raj P.',
      title: 'Gym Owner, Performance Fitness Studio',
      stars: 5,
    },
  ]

  return (
    <section className="py-20 sm:py-28 bg-[#0A0A0F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="font-bold text-3xl sm:text-4xl text-white">
              Trainers who made the switch
            </h2>
          </div>
        </Reveal>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={fadeUp}>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-7 h-full flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 text-orange-400 fill-orange-400" />
                  ))}
                </div>
                <blockquote className="text-gray-300 text-sm leading-relaxed flex-1 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{t.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   FAQ SECTION
═══════════════════════════════════════════════════ */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      q: 'Is this really a one-time payment — no subscriptions ever?',
      a: "Yes. You pay once for your chosen tier (Starter $199, Professional $299, or Enterprise $399) and the software is yours forever. No monthly fees, no annual renewals, no hidden charges.",
    },
    {
      q: 'Can I upgrade from Starter to Professional later?',
      a: "Absolutely. Your data carries over completely. You purchase the next tier at any time and your clients, programs, and workout history are all preserved. You never lose what you've built.",
    },
    {
      q: 'How does EvoFit compare to Everfit or TrueCoach?',
      a: 'EvoFit offers comparable or better features — ACWR training load monitoring, RPE/RIR/tempo prescriptions, iCal export, offline workout logging — at a one-time price. Everfit and TrueCoach charge $80–199/month, every month, with per-client fees that grow as your roster does.',
    },
    {
      q: 'Does it work on mobile?',
      a: "Yes. EvoFit is a Progressive Web App (PWA) — installable from your browser on iPhone, Android, or desktop. No app store required, no version fragmentation. Clients can log workouts offline and the data syncs automatically when they reconnect.",
    },
    {
      q: 'What is ACWR and why does it matter?',
      a: 'ACWR (Acute:Chronic Workload Ratio) is the training load monitoring system used by professional sports teams (NFL, NBA, Premier League). It compares your 7-day workload to your 28-day average to identify under-training, optimal training, and injury risk zones. EvoFit includes it in Professional tier at no extra charge.',
    },
    {
      q: 'What happens to my data if EvoFit shuts down?',
      a: "You can export all your data — clients, programs, workout history, analytics — in CSV format at any time. You always own your data. EvoFit is deployed on Vercel with Neon PostgreSQL and Upstash Redis — production-grade infrastructure — and the codebase is designed for longevity.",
    },
    {
      q: 'Is there a free trial?',
      a: "You can register for free and explore the platform. The Starter tier at $199 is backed by a 30-day money-back guarantee — if you're unsatisfied within 30 days, contact support for a full refund.",
    },
  ]

  return (
    <section className="py-20 sm:py-28 bg-[#0D0D14]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-blue-400 uppercase tracking-widest mb-3">
              FAQ
            </span>
            <h2 className="font-bold text-3xl sm:text-4xl text-white">Common questions</h2>
          </div>
        </Reveal>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <Reveal key={i}>
              <button
                className="w-full text-left rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.05] transition-colors p-5"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-semibold text-white text-sm leading-relaxed">{faq.q}</span>
                  <span className="flex-shrink-0 mt-0.5">
                    {openIndex === i ? (
                      <ChevronUp className="w-4 h-4 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </span>
                </div>
                {openIndex === i && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 text-gray-400 text-sm leading-relaxed"
                  >
                    {faq.a}
                  </motion.p>
                )}
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   FINAL CTA SECTION
═══════════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section className="py-20 sm:py-28 bg-[#0A0A0F] relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-orange-500/10 rounded-full blur-[160px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 rounded-full px-4 py-1.5 mb-8">
            <Trophy className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-300 font-medium">
              Join trainers who own their platform
            </span>
          </div>

          <h2 className="font-extrabold text-4xl sm:text-5xl md:text-6xl text-white leading-tight mb-6">
            Stop Paying Monthly.
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              Start Owning Forever.
            </span>
          </h2>

          <p className="text-gray-400 text-xl mb-10 max-w-xl mx-auto">
            Start at $199. Upgrade any time. Your clients, your programs, your platform — no
            subscription strings attached.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <button className="group inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-10 py-4 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-[1.02]">
                Get Lifetime Access
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/free-blueprint">
              <button className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/8 font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-300">
                Free Programming Blueprint
              </button>
            </Link>
          </div>

          {/* Trust row */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-gray-600" /> 30-day refund guarantee
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-600" /> Pay once, own forever
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-gray-600" /> Instant access after purchase
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#080810] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-white">EvoFit Trainer</span>
        </div>
        <p className="text-gray-600 text-sm text-center">
          © 2026 EvoFit Trainer · Production at{' '}
          <a
            href="https://evofittrainer-six.vercel.app"
            className="text-blue-500/70 hover:text-blue-400 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            evofittrainer-six.vercel.app
          </a>
        </p>
        <div className="flex items-center gap-5 text-sm text-gray-600">
          <Link href="/pricing" className="hover:text-gray-300 transition-colors">
            Pricing
          </Link>
          <Link href="/register" className="hover:text-gray-300 transition-colors">
            Sign Up
          </Link>
          <Link href="/login" className="hover:text-gray-300 transition-colors">
            Login
          </Link>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════ */
export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-x-hidden">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <StatsSection />
      <FeaturesSection />
      <TierComparisonSection />
      <CompetitorTable />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  )
}
