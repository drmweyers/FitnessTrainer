'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  X,
  Shield,
  ArrowRight,
  Zap,
  DollarSign,
  Users,
  Dumbbell,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react'

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const tiers = [
  {
    name: 'Starter',
    price: '$199',
    cadence: 'one-time',
    tagline: 'Your Coaching Platform. Forever.',
    description:
      'For the solo trainer with 1–5 clients who wants professional software without subscription fatigue.',
    priceId: 'starter',
    cta: 'Get Started for $199',
    highlighted: false,
    learnMoreHref: '/starter',
    features: [
      '1,324 exercises with animated GIF demonstrations',
      'Up to 5 active clients with 5-status lifecycle tracking',
      'Set-by-set workout logging with automatic PR detection',
      'PR confetti celebration + personal best tracking',
      'Built-in rest timer (auto-starts after each set)',
      'Adherence scoring per session',
      'Body composition tracking across 8 metric types',
      '2 active fitness goals with progress bars',
      'PWA-installable — works offline on any device',
      'Offline workout logging via IndexedDB',
    ],
  },
  {
    name: 'Professional',
    price: '$299',
    cadence: 'one-time',
    tagline: 'Run a Professional Coaching Business. Own It Forever.',
    description:
      'The complete platform for the full-time trainer. Unlimited clients, full program builder, ACWR analytics.',
    priceId: 'professional',
    cta: 'Upgrade to Professional — $299',
    highlighted: true,
    badge: 'Most Popular',
    learnMoreHref: '/professional',
    features: [
      'Unlimited active clients (no roster cap, ever)',
      '8 program types: Strength, Hypertrophy, Powerlifting, Rehabilitation + more',
      '7 set types: Drop Sets, Pyramid, AMRAP, Cluster, Rest-Pause + more',
      'RPE, RIR, and tempo prescriptions per set — elite S&C programming language',
      'Superset + circuit support with A/B/C execution labelling',
      'Deload week planning with auto-reduced volume flags',
      'Template library — save and reuse programs across clients',
      'ACWR training load monitoring (used by NFL & NBA teams)',
      'iCal export + subscribable calendar feed for Google/Apple Calendar',
      'Analytics reports in PDF and CSV (weekly, monthly, quarterly)',
      'Bulk program assignment to tag groups in one click',
      'Unlimited custom color tags for roster segmentation',
    ],
  },
  {
    name: 'Enterprise',
    price: '$399',
    cadence: 'one-time',
    tagline: 'Platform-Level Control for Gym Owners and Studio Operators.',
    description:
      'Admin dashboard, audit logs, feature flags, and multi-trainer oversight. Run EvoFit as your studio OS.',
    priceId: 'enterprise',
    cta: 'Get Enterprise Access — $399',
    highlighted: false,
    learnMoreHref: '/enterprise',
    features: [
      'Everything in Professional included',
      'Admin dashboard: platform-wide user, session, and growth stats',
      'Full user management: search, filter, activate/deactivate, change roles',
      'Feature flags API — enable features per user without code deploys',
      'Activity log + security audit trail (IP, device, role changes)',
      'Bulk user operations — activate, deactivate, or re-role in one action',
      'System health monitoring: PostgreSQL, Redis, and API status in real time',
      'Content moderation tools and support ticket management',
      'Account lockout controls from the admin panel',
    ],
  },
]

const stackItems = [
  {
    icon: Dumbbell,
    label: '1,324 Exercise Library with GIF Demos',
    value: '$2,400/yr',
  },
  {
    icon: BarChart3,
    label: 'Program Builder (8 types, 7 set types, RPE/RIR/Tempo)',
    value: '$1,800/yr',
  },
  {
    icon: Users,
    label: 'Client Management (unlimited + bulk ops)',
    value: '$1,200/yr',
  },
  {
    icon: BarChart3,
    label: 'Analytics & ACWR Training Load Monitoring',
    value: '$960/yr',
  },
  {
    icon: Calendar,
    label: 'Scheduling & iCal Calendar Export',
    value: '$600/yr',
  },
  {
    icon: Zap,
    label: 'Offline PWA + Background Sync + Push Notifications',
    value: '$480/yr',
  },
]

const comparisonCategories = [
  {
    name: 'Exercise Library',
    rows: [
      { label: '1,324 exercises with GIF demos', starter: true, pro: true, ent: true, addon: null },
      { label: 'Full-text search + multi-filter stacking', starter: true, pro: true, ent: true, addon: null },
      { label: 'Exercise favorites + custom collections', starter: '3 max', pro: 'Unlimited', ent: 'Unlimited', addon: null },
      { label: 'Collection sharing (public/private)', starter: false, pro: true, ent: true, addon: null },
    ],
  },
  {
    name: 'Client Management',
    rows: [
      { label: 'Active clients', starter: 'Up to 5', pro: 'Unlimited', ent: 'Unlimited', addon: null },
      { label: 'Email invitation system + status tracking', starter: true, pro: true, ent: true, addon: null },
      { label: 'Custom color tags', starter: '3 tags', pro: 'Unlimited', ent: 'Unlimited', addon: null },
      { label: 'Bulk invite + bulk program assignment', starter: false, pro: true, ent: true, addon: null },
      { label: 'Tag-based filtering + bulk ops', starter: false, pro: true, ent: true, addon: null },
    ],
  },
  {
    name: 'Program Builder',
    rows: [
      { label: '8 program types', starter: false, pro: true, ent: true, addon: null },
      { label: '7 set types (AMRAP, Drop, Pyramid, Cluster…)', starter: false, pro: true, ent: true, addon: null },
      { label: 'RPE / RIR / Tempo prescriptions per set', starter: false, pro: true, ent: true, addon: null },
      { label: 'Superset + circuit support', starter: false, pro: true, ent: true, addon: null },
      { label: 'Deload weeks + template library', starter: false, pro: true, ent: true, addon: null },
    ],
  },
  {
    name: 'Workout Tracking',
    rows: [
      { label: 'Set-by-set logging + rest timer', starter: true, pro: true, ent: true, addon: null },
      { label: 'Automatic PR detection + confetti celebration', starter: true, pro: true, ent: true, addon: null },
      { label: 'Adherence scoring + workout history', starter: true, pro: true, ent: true, addon: null },
      { label: 'Trainer feedback on client sessions', starter: false, pro: true, ent: true, addon: null },
      { label: 'Offline logging + background sync', starter: true, pro: true, ent: true, addon: null },
    ],
  },
  {
    name: 'Analytics',
    rows: [
      { label: 'Body composition tracking (8 metrics)', starter: 'Basic', pro: 'Full', ent: 'Full', addon: null },
      { label: 'ACWR training load monitoring', starter: false, pro: true, ent: true, addon: null },
      { label: 'Personal bests + goal tracking (8 types)', starter: '2 goals', pro: 'Unlimited', ent: 'Unlimited', addon: null },
      { label: 'Analytics reports (PDF + CSV export)', starter: false, pro: true, ent: true, addon: null },
      { label: 'AI-powered coaching insights', starter: false, pro: 'Coming Soon', ent: 'Coming Soon', addon: null },
    ],
  },
  {
    name: 'Scheduling',
    rows: [
      { label: 'Calendar view (monthly + weekly)', starter: true, pro: true, ent: true, addon: null },
      { label: 'Availability config + 5 appointment types', starter: false, pro: true, ent: true, addon: null },
      { label: 'Online session meeting links', starter: false, pro: true, ent: true, addon: null },
      { label: 'iCal export + subscribable calendar feed', starter: false, pro: true, ent: true, addon: null },
    ],
  },
  {
    name: 'AI Features',
    rows: [
      { label: 'AI workout generator (1,324-exercise library)', starter: false, pro: false, ent: false, addon: 'Coming Soon' },
      { label: 'RPE-based progression suggestions', starter: false, pro: false, ent: false, addon: true },
      { label: 'Plateau detection + deload suggestions', starter: false, pro: false, ent: false, addon: 'Coming Soon' },
      { label: 'Push notifications + biometric login', starter: false, pro: false, ent: false, addon: true },
    ],
  },
  {
    name: 'Admin & Security',
    rows: [
      { label: 'Admin dashboard + user management', starter: false, pro: false, ent: true, addon: null },
      { label: 'Feature flags + activity audit log', starter: false, pro: false, ent: true, addon: null },
      { label: 'Bulk user operations + system health', starter: false, pro: false, ent: true, addon: null },
      { label: 'JWT auth + email verification + lockout', starter: true, pro: true, ent: true, addon: null },
    ],
  },
]

const competitors = [
  {
    name: 'EvoFit Trainer',
    monthlyEquivalent: '$0/mo after purchase',
    yearOneCost: '$299 (Professional)',
    threeYearCost: '$299',
    isEvofit: true,
    note: 'One-time. Own forever.',
  },
  {
    name: 'Everfit',
    monthlyEquivalent: '~$150/mo',
    yearOneCost: '$1,800/yr',
    threeYearCost: '$5,400',
    note: 'Monthly subscription, per-client tiers',
  },
  {
    name: 'TrueCoach',
    monthlyEquivalent: '~$19–$150/mo',
    yearOneCost: '$228–$1,800/yr',
    threeYearCost: '$684–$5,400',
    note: 'Per-active-client fees',
  },
  {
    name: 'TrainHeroic',
    monthlyEquivalent: '~$89/mo',
    yearOneCost: '$1,068/yr',
    threeYearCost: '$3,204',
    note: 'Monthly, team-based tiers',
  },
]

const faqs = [
  {
    q: 'Can I upgrade later from Starter to Professional or Enterprise?',
    a: 'Yes, absolutely. Any time you outgrow your current tier, simply purchase the higher tier and your existing data — clients, programs, workout history, analytics — carries over. You never lose what you\'ve built.',
  },
  {
    q: 'Are there any per-client fees?',
    a: 'Never. EvoFit charges no per-client fees on any tier. Professional and Enterprise include unlimited clients with a single one-time purchase. Your software costs stay flat no matter how much your roster grows.',
  },
  {
    q: 'Is there a free trial?',
    a: 'We offer a 14-day money-back guarantee on all tiers — full refund, no questions asked. Create an account, explore the platform, and if EvoFit isn\'t the right fit within 14 days, we\'ll refund every penny.',
  },
  {
    q: 'Does EvoFit work offline?',
    a: 'Yes. Workout logging is fully offline via IndexedDB. Clients can log every rep and set in the gym without a Wi-Fi connection, and the background sync manager automatically uploads all data when the connection returns.',
  },
  {
    q: 'Can clients book sessions themselves?',
    a: 'Yes — on Professional and Enterprise, clients can book within the trainer\'s configured availability slots. Clients can also subscribe to a live calendar feed in Google Calendar or Apple Calendar via iCal.',
  },
  {
    q: 'Is EvoFit a PWA? Do I need to download an app?',
    a: 'EvoFit is a Progressive Web App. Visit the URL on any device, tap "Add to Home Screen," and it installs like a native app — no App Store or Play Store required. Updates deploy instantly with no version fragmentation.',
  },
  {
    q: 'What programming features does Professional include vs Starter?',
    a: 'Starter includes basic workout logging and exercise access. Professional unlocks the full Program Builder: 8 program types, 7 set types (AMRAP, Drop Sets, Pyramid, Cluster, Rest-Pause), RPE/RIR/Tempo prescriptions, superset and circuit support, deload weeks, and a reusable template library.',
  },
  {
    q: 'Is my client data secure and exportable?',
    a: 'Yes. EvoFit uses JWT authentication, email verification, and account lockout protection on every tier. All analytics data is exportable in CSV format. Every tier includes a full security audit log. You own your clients\' data and can export everything at any time.',
  },
  {
    q: 'What is ACWR and why does it matter?',
    a: 'ACWR (Acute:Chronic Workload Ratio) is the same training load monitoring system used by professional sports teams in the NFL, NBA, and Premier League. It compares your client\'s recent 7-day training volume against their 28-day average to detect under-training (<0.8), optimal adaptation (0.8–1.3), caution (1.3–1.5), and overtraining risk (>1.5) — automatically, for every client on Professional and Enterprise.',
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function CellValue({ value }: { value: boolean | string | null }) {
  if (value === null) return <span className="text-gray-300 text-sm">—</span>
  if (value === true) return <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
  if (value === false) return <X className="h-4 w-4 text-gray-300 mx-auto" />
  return <span className="text-xs font-medium text-blue-600 text-center block">{value}</span>
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 pr-4">{q}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

function ComparisonCategoryRow({
  category,
  defaultOpen,
}: {
  category: (typeof comparisonCategories)[0]
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <>
      <tr
        className="bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <td className="px-4 py-3 font-bold text-gray-900 text-sm flex items-center gap-2">
          {open ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
          {category.name}
        </td>
        <td colSpan={3} />
      </tr>
      {open &&
        category.rows.map((row) => (
          <tr key={row.label} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 text-sm text-gray-700 pl-8">{row.label}</td>
            <td className="px-4 py-3 text-center">
              <CellValue value={row.starter} />
            </td>
            <td className="px-4 py-3 text-center bg-blue-50/30">
              <CellValue value={row.pro} />
            </td>
            <td className="px-4 py-3 text-center">
              <CellValue value={row.ent} />
            </td>
          </tr>
        ))}
    </>
  )
}

// ─── Checkout Handler ──────────────────────────────────────────────────────────

async function handleCheckout(priceId: string) {
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    }
  } catch {
    // fallback: navigate to register
    window.location.href = '/auth/register'
  }
}

// ─── Page Component ────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-4">
              <span className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white text-sm font-medium px-4 py-1.5 rounded-full">
                <Shield className="h-4 w-4" />
                30-Day Money-Back Guarantee on All Plans
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4"
            >
              Simple, One-Time Pricing
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-6"
            >
              Pay once. Own forever.{' '}
              <span className="text-white font-semibold">Save $5,700+ over competitors.</span>
            </motion.p>

            <motion.p variants={fadeInUp} className="text-blue-200 text-sm">
              No monthly fees · No per-client charges · No renewal reminders · Ever
            </motion.p>
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0 60L60 55C120 50 240 40 360 35C480 30 600 30 720 35C840 40 960 50 1080 50C1200 50 1320 40 1380 35L1440 30V60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── 2. PRICING CARDS ────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {tiers.map((tier) => (
              <motion.div
                key={tier.name}
                variants={fadeInUp}
                className={`relative rounded-2xl border-2 flex flex-col ${
                  tier.highlighted
                    ? 'border-blue-600 shadow-xl shadow-blue-100'
                    : 'border-gray-200'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      <Star className="h-3 w-3 fill-white" />
                      {tier.badge}
                    </span>
                  </div>
                )}


<div className={`p-6 ${tier.highlighted ? 'bg-blue-600 text-white rounded-t-2xl' : ''}`}>
                  <h3 className={`text-lg font-bold mb-1 ${tier.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {tier.name}
                  </h3>
                  <div className="flex items-end gap-1 mb-1">
                    <span className={`text-4xl font-extrabold ${tier.highlighted ? 'text-white' : 'text-gray-900'}`}>
                      {tier.price}
                    </span>
                    <span className={`text-sm pb-1.5 ${tier.highlighted ? 'text-blue-200' : 'text-gray-500'}`}>
                      {tier.cadence}
                    </span>
                  </div>
                  <p className={`text-sm leading-snug ${tier.highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
                    {tier.description}
                  </p>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1 mb-6">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-500" />
                        <span className="text-sm text-gray-700 leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleCheckout(tier.priceId)}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      tier.highlighted
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {tier.cta}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  {tier.learnMoreHref && (
                    <div className="mt-3 text-center">
                      <Link
                        href={tier.learnMoreHref}
                        className={`text-xs font-medium hover:underline transition-colors ${
                          tier.highlighted
                            ? 'text-blue-500 hover:text-blue-400'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        Learn more &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm text-gray-500 mt-6"
          >
            All prices in USD · Secure checkout via Stripe · 14-day money-back guarantee
          </motion.p>
        </div>
      </section>

      {/* ── 3. STACK SLIDE (Brunson value anchoring) ────────────────────────── */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Here&rsquo;s What You&rsquo;re Getting
              </h2>
              <p className="text-gray-600">
                If you bought each feature separately from competing SaaS tools, here&rsquo;s what it would cost you per year.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="divide-y divide-gray-100">
                {stackItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-800 text-sm font-medium">{item.label}</span>
                    </div>
                    <span className="text-gray-500 text-sm font-mono tabular-nums whitespace-nowrap ml-4">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-gray-50 border-t-2 border-gray-200 divide-y divide-gray-200">
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="font-bold text-gray-900">Total Value</span>
                  <span className="font-bold text-gray-900 font-mono text-lg line-through decoration-red-400">
                    $7,440/year
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white">
                  <div>
                    <span className="font-extrabold text-lg">You Pay (Professional)</span>
                    <p className="text-blue-200 text-xs mt-0.5">One-time · Own forever · 98% off</p>
                  </div>
                  <span className="font-extrabold text-2xl">$299</span>
                </div>
              </div>
            </motion.div>

            <motion.p
              variants={fadeInUp}
              className="text-center text-gray-500 text-sm mt-4"
            >
              That&rsquo;s <strong className="text-gray-900">98% off</strong> the equivalent annual SaaS cost — forever, not just year one.
            </motion.p>

            <motion.div variants={fadeInUp} className="text-center mt-6">
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                See All Plans
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 4. COMPARISON TABLE ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Full Feature Comparison
              </h2>
              <p className="text-gray-600">Every feature. Every tier. No surprises.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-4 text-left text-gray-900 font-bold w-1/2 md:w-2/5">Feature</th>
                    <th className="px-4 py-4 text-center text-gray-700 font-semibold">
                      <div>Starter</div>
                      <div className="text-blue-600 font-bold">$199</div>
                    </th>
                    <th className="px-4 py-4 text-center bg-blue-50 font-semibold">
                      <div className="text-blue-700">Professional</div>
                      <div className="text-blue-600 font-bold">$299</div>
                    </th>
                    <th className="px-4 py-4 text-center text-gray-700 font-semibold">
                      <div>Enterprise</div>
                      <div className="text-blue-600 font-bold">$399</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonCategories.map((cat, idx) => (
                    <ComparisonCategoryRow
                      key={cat.name}
                      category={cat}
                      defaultOpen={idx < 3}
                    />
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 5. COMPETITOR COMPARISON ────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Stop Renting. Start Owning.
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Every other coaching platform charges you every month — forever. EvoFit charges you once. Here&rsquo;s what that means over 3 years:
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-5 py-4 text-left font-bold text-gray-900">Platform</th>
                    <th className="px-5 py-4 text-center font-semibold text-gray-700">Monthly Cost</th>
                    <th className="px-5 py-4 text-center font-semibold text-gray-700">Year 1 Cost</th>
                    <th className="px-5 py-4 text-center font-semibold text-gray-700">3-Year Cost</th>
                    <th className="px-5 py-4 text-left font-semibold text-gray-700">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((c) => (
                    <tr
                      key={c.name}
                      className={`border-b border-gray-100 ${c.isEvofit ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-5 py-4">
                        <span className={`font-bold ${c.isEvofit ? 'text-blue-700' : 'text-gray-900'}`}>
                          {c.name}
                        </span>
                        {c.isEvofit && (
                          <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                            You&rsquo;re here
                          </span>
                        )}
                      </td>
                      <td className={`px-5 py-4 text-center font-mono font-semibold ${c.isEvofit ? 'text-green-600' : 'text-red-500'}`}>
                        {c.monthlyEquivalent}
                      </td>
                      <td className={`px-5 py-4 text-center font-mono font-bold ${c.isEvofit ? 'text-blue-700 text-lg' : 'text-gray-700'}`}>
                        {c.yearOneCost}
                      </td>
                      <td className={`px-5 py-4 text-center font-mono font-bold ${c.isEvofit ? 'text-blue-700 text-lg' : 'text-gray-700'}`}>
                        {c.threeYearCost}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{c.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'vs Everfit (3 years)', savings: '$5,101', detail: '$5,400 − $299' },
                { label: 'vs TrueCoach (3 years)', savings: 'Up to $5,101', detail: 'At $150/mo plan' },
                { label: 'vs TrainHeroic (3 years)', savings: '$2,905', detail: '$3,204 − $299' },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                  <div className="text-2xl font-extrabold text-green-600 mb-1">{s.savings}</div>
                  <div className="text-sm font-semibold text-gray-900">{s.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.detail}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 6. FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600">Everything you need to know before you buy.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="space-y-3">
              {faqs.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 7. GUARANTEE ────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="bg-white border-2 border-blue-100 rounded-2xl p-8 md:p-12 text-center shadow-sm"
          >
            <div className="inline-flex p-4 bg-blue-50 rounded-full mb-6">
              <Shield className="h-10 w-10 text-blue-600" />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              14-Day Money-Back Guarantee
            </h2>

            <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto mb-6">
              Try EvoFit risk-free. If it isn&rsquo;t the right fit within 14 days, we&rsquo;ll refund every penny — no questions asked, no hard feelings.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {[
                { icon: CheckCircle2, text: 'Full refund within 14 days' },
                { icon: CheckCircle2, text: 'No questions asked' },
                { icon: CheckCircle2, text: 'Keep your exported data' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Icon className="h-4 w-4 text-green-500" />
                  {text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 8. FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white rounded-full -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-4">
              <span className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white text-sm font-medium px-4 py-1.5 rounded-full">
                <DollarSign className="h-4 w-4" />
                Join trainers who own their platform
              </span>
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
            >
              Stop Paying Monthly.{' '}
              <span className="text-blue-200">Start Owning Forever.</span>
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="text-blue-100 text-lg md:text-xl mb-8 max-w-xl mx-auto"
            >
              1,324 exercises · unlimited clients · ACWR analytics · offline-first PWA · all in one platform, one payment, forever.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
              >
                See All Plans
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold border-2 border-white/30 text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                Create Free Account
              </Link>
            </motion.div>

            <motion.p variants={fadeInUp} className="text-blue-300 text-sm mt-6">
              Professional tier · $3$39$199 one-time · 14-day money-back guarantee · Secure checkout via Stripe
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── 9. NOT SURE WHICH PLAN ───────────────────────────────────────── */}
      <section className="py-12 md:py-16 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-gray-900 mb-3"
            >
              Not sure which plan is right for you?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-gray-600 mb-6 max-w-xl mx-auto"
            >
              Answer 3 quick questions and we&rsquo;ll recommend the best tier for your coaching business — no sign-up required.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                Find My Plan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
