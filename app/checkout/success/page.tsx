'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  ArrowRight,
  User,
  Users,
  ClipboardList,
  LogIn,
  Lock,
  Sparkles,
  Zap,
  AlertTriangle,
  Gift,
  Check,
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

const onboardingSteps = [
  {
    step: 1,
    icon: User,
    title: 'Set up your profile',
    description: 'Add your certifications, specializations, and trainer bio.',
    href: '/profile/edit',
    cta: 'Go to Profile',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'bg-blue-100 text-blue-600',
  },
  {
    step: 2,
    icon: Users,
    title: 'Invite your first client',
    description: 'Send a branded email invitation — they register via a secure link.',
    href: '/clients',
    cta: 'Go to Clients',
    color: 'bg-green-50 border-green-200',
    iconColor: 'bg-green-100 text-green-600',
  },
  {
    step: 3,
    icon: ClipboardList,
    title: 'Build your first program',
    description: 'Use a template or start from scratch with 8 program types and 7 set types.',
    href: '/programs/new',
    cta: 'Build a Program',
    color: 'bg-purple-50 border-purple-200',
    iconColor: 'bg-purple-100 text-purple-600',
  },
]

// ---------- OTO Configuration ----------

type StackItem = { feature: string; value: string; description: string }

type OtoConfig = {
  kind: 'upgrade'
  fromTier: string
  toTier: string
  toPriceId: string
  toPrice: number
  headline: string
  subhead: string
  urgency: string
  stack: StackItem[]
  totalValue: string
  hormoziPitch: string
  ctaLabel: string
  declineLabel: string
}

const STARTER_OTO: OtoConfig = {
  kind: 'upgrade',
  fromTier: 'Starter',
  toTier: 'Professional',
  toPriceId: 'price_1TEwpcGo4HHYDfDVqNAFCnDt',
  toPrice: 299,
  headline: 'WAIT — One Special Offer Before You Log In',
  subhead:
    "You just unlocked Starter. Before you go set up your account, here's the ONE upgrade offer trainers ask us about most — and it's only available right now, on this page.",
  urgency:
    'This upgrade price is only available on this page, right now. Once you click through to login, it disappears and the only way back in is at full price.',
  stack: [
    {
      feature: 'Unlimited Active Clients',
      value: '$297/yr saved',
      description: 'Lift the 5-client cap. Scale your roster without ever bumping a wall.',
    },
    {
      feature: 'AI Exercise Suggestions',
      value: '$197 value',
      description: '"Suggest next exercise" button — programs built in half the time.',
    },
    {
      feature: 'PDF Program Export',
      value: '$97 value',
      description: 'Branded, client-ready PDFs they can print or save offline.',
    },
    {
      feature: 'ACWR Training Load Analytics',
      value: '$147 value',
      description: 'The same overload-vs-injury science used by pro sports teams.',
    },
    {
      feature: 'Video Preview in Exercise Library',
      value: '$67 value',
      description: 'See every movement before you drag it into a program.',
    },
    {
      feature: 'Mobile Drag-Optimized Canvas',
      value: '$47 value',
      description: 'Build full programs from your phone between sessions.',
    },
    {
      feature: 'CSV Export Format',
      value: '$47 value',
      description: 'Hand off data to spreadsheets, accountants, or other tools instantly.',
    },
  ],
  totalValue: '$899',
  hormoziPitch:
    "You just invested $199. Unlimited Clients alone pays that back the moment your 6th client signs up — and then every client after that is pure profit. The math isn't close.",
  ctaLabel: 'Yes — Upgrade to Professional for $299',
  declineLabel: "No thanks, I'm happy with 5 clients for now",
}

const PROFESSIONAL_OTO: OtoConfig = {
  kind: 'upgrade',
  fromTier: 'Professional',
  toTier: 'Enterprise',
  toPriceId: 'price_1TEwpeGo4HHYDfDVe7M1XZTD',
  toPrice: 399,
  headline: 'WAIT — One Special Offer Before You Log In',
  subhead:
    "Professional is the perfect fit for solo trainers. But if you've ever thought about hiring a second coach, training a team, or licensing your programs — read this first.",
  urgency:
    'This Enterprise upgrade is only $100 more from this page. Once you click through to login, the upgrade goes back to its standard $399 entry price with no on-ramp.',
  stack: [
    {
      feature: 'Team Template Sharing',
      value: '$297 value',
      description: 'Build once, share across every coach on your team. Brand consistency on autopilot.',
    },
    {
      feature: 'Bulk Program Assignment',
      value: '$197 value',
      description: 'Push a program to 20 clients in a single click instead of 20.',
    },
    {
      feature: 'Full API Access',
      value: '$497 value',
      description: 'Plug EvoFit into your CRM, your website, your custom dashboards. No restrictions.',
    },
    {
      feature: 'Excel Export Format',
      value: '$67 value',
      description: 'For the data-driven coach who lives in spreadsheets.',
    },
    {
      feature: 'Unlimited Custom Exercises',
      value: '$197 value',
      description: 'No 500-exercise cap — build out your full proprietary library.',
    },
  ],
  totalValue: '$1,255',
  hormoziPitch:
    'You just invested $299. Bulk assignment alone saves you 30+ minutes per program drop — that\'s 25 hours back this year. At $80/hr that\'s $2,000 of your time recovered for $100.',
  ctaLabel: 'Yes — Upgrade to Enterprise for $399',
  declineLabel: "No thanks, I don't need team features right now",
}

// ---------- Components ----------

function OtoSection({ oto, onAccept, onDecline, loading }: {
  oto: OtoConfig
  onAccept: () => void
  onDecline: () => void
  loading: boolean
}) {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="mb-12 rounded-3xl overflow-hidden border-2 border-amber-300 shadow-2xl"
    >
      {/* Urgency banner */}
      <motion.div
        variants={fadeInUp}
        className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white px-6 py-3 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide"
      >
        <AlertTriangle className="h-4 w-4" />
        One-Time Offer — This Page Only
        <AlertTriangle className="h-4 w-4" />
      </motion.div>

      <div className="bg-gradient-to-b from-white to-amber-50 px-6 py-10 sm:px-10 sm:py-12">
        {/* Headline */}
        <motion.h2
          variants={fadeInUp}
          className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-4 leading-tight"
        >
          {oto.headline}
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="text-base sm:text-lg text-gray-700 text-center max-w-2xl mx-auto mb-8"
        >
          {oto.subhead}
        </motion.p>

        {/* Urgency callout */}
        <motion.div
          variants={fadeInUp}
          className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg max-w-2xl mx-auto"
        >
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900 font-medium">{oto.urgency}</p>
          </div>
        </motion.div>

        {/* Stack slide */}
        <motion.div
          variants={fadeInUp}
          className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-2xl mx-auto"
        >
          <div className="bg-gray-900 text-white px-6 py-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-lg">Here&apos;s Everything You Unlock:</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {oto.stack.map((item, idx) => (
              <li key={idx} className="px-6 py-4 flex items-start gap-4">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <p className="font-bold text-gray-900">{item.feature}</p>
                    <p className="text-sm font-bold text-green-700 whitespace-nowrap">{item.value}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5 border-t-2 border-dashed border-amber-300">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <span className="text-base font-semibold text-gray-700">Total Real Value:</span>
              <span className="text-xl font-extrabold text-gray-900">{oto.totalValue}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-base font-semibold text-gray-700">Your Upgrade Today:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-base text-gray-400 line-through">{oto.totalValue}</span>
                <span className="text-3xl font-extrabold text-orange-600">${oto.toPrice}</span>
                <span className="text-sm text-gray-500">one-time</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hormozi value pitch */}
        <motion.div
          variants={fadeInUp}
          className="mb-8 max-w-2xl mx-auto p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <Zap className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-base text-blue-950 leading-relaxed font-medium">
              {oto.hormoziPitch}
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeInUp} className="max-w-2xl mx-auto">
          <button
            onClick={onAccept}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-5 text-lg sm:text-xl font-extrabold bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-xl hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Securing your upgrade...
              </>
            ) : (
              <>
                {oto.ctaLabel}
                <ArrowRight className="h-6 w-6" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-500 mt-3">
            One-time payment. No subscriptions. Lifetime upgrade. 30-day money-back guarantee.
          </p>

          <div className="text-center mt-5">
            <button
              onClick={onDecline}
              className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2"
            >
              {oto.declineLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

function EnterpriseAddOnSection({ onAccept, onDecline, loading }: {
  onAccept: () => void
  onDecline: () => void
  loading: boolean
}) {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="mb-12 rounded-3xl overflow-hidden border-2 border-indigo-300 shadow-2xl"
    >
      <motion.div
        variants={fadeInUp}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-6 py-3 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide"
      >
        <Gift className="h-4 w-4" />
        Enterprise Member Exclusive
        <Gift className="h-4 w-4" />
      </motion.div>

      <div className="bg-gradient-to-b from-white to-indigo-50 px-6 py-10 sm:px-10 sm:py-12">
        <motion.h2
          variants={fadeInUp}
          className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-4 leading-tight"
        >
          Keep Your Platform Evolving — Without Lifting a Finger
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="text-base sm:text-lg text-gray-700 text-center max-w-2xl mx-auto mb-8"
        >
          You just bought EvoFit Enterprise outright. The Evolution Add-on is how the top 1% of trainers stay current — monthly feature drops, priority support, and advanced analytics that compound over time.
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-2xl mx-auto"
        >
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white px-6 py-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-lg">What You Get Every Month:</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {[
              { f: 'Priority Support — Front of the Line', v: '$97/mo value', d: 'Skip the queue. Direct access to senior support staff.' },
              { f: 'Monthly Feature Drops', v: '$197/mo value', d: 'Every new feature we ship lands in your account first.' },
              { f: 'Advanced Analytics Dashboards', v: '$147/mo value', d: 'Cohort retention, revenue per client, churn signals — the metrics that grow gyms.' },
              { f: 'Beta Access to Experimental Tools', v: '$67/mo value', d: 'Shape the roadmap. Vote on what we build next.' },
            ].map((item, idx) => (
              <li key={idx} className="px-6 py-4 flex items-start gap-4">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <p className="font-bold text-gray-900">{item.f}</p>
                    <p className="text-sm font-bold text-green-700 whitespace-nowrap">{item.v}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{item.d}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-5 border-t-2 border-dashed border-indigo-300">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <span className="text-base font-semibold text-gray-700">Total Monthly Value:</span>
              <span className="text-xl font-extrabold text-gray-900">$508/mo</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-base font-semibold text-gray-700">Your Price:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-base text-gray-400 line-through">$508</span>
                <span className="text-3xl font-extrabold text-indigo-600">$39.99</span>
                <span className="text-sm text-gray-500">/month</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="mb-8 max-w-2xl mx-auto p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <Zap className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-base text-indigo-950 leading-relaxed font-medium">
              $39.99/mo is one client session. If a single new feature, support save, or analytics insight earns you back one client per year — it pays for itself ten times over. Cancel anytime.
            </p>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="max-w-2xl mx-auto">
          <button
            onClick={onAccept}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-5 text-lg sm:text-xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Activating add-on...
              </>
            ) : (
              <>
                Yes — Add Evolution for $39.99/mo
                <ArrowRight className="h-6 w-6" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-500 mt-3">
            Cancel anytime in one click. No long-term commitment.
          </p>

          <div className="text-center mt-5">
            <button
              onClick={onDecline}
              className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2"
            >
              No thanks, I&apos;ll stick with my Enterprise license as-is
            </button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

// ---------- Main Page ----------

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const tier = (searchParams.get('tier') ?? 'professional').toLowerCase()
  const tierLabel = TIER_LABELS[tier] ?? 'EvoFit'
  const [loading, setLoading] = useState(false)

  const handleCheckout = async (priceId: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      if (!res.ok) throw new Error('Checkout session failed')
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
        return
      }
      throw new Error('No checkout URL returned')
    } catch (err) {
      console.error('[OTO] Checkout failed, falling back to register:', err)
      window.location.href = '/auth/register'
    } finally {
      setLoading(false)
    }
  }

  const scrollToLogin = () => {
    const el = document.getElementById('login-cta')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  let oto: OtoConfig | null = null
  if (tier === 'starter') oto = STARTER_OTO
  else if (tier === 'professional') oto = PROFESSIONAL_OTO

  const isEnterprise = tier === 'enterprise'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="EvoFit" width={36} height={36} className="rounded-lg" />
          <span className="font-bold text-lg tracking-tight">EvoFit Trainer</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto px-4 py-12 sm:py-16"
      >
        {/* Celebration header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.div variants={fadeInUp} className="flex justify-center mb-5">
            <div className="bg-green-100 rounded-full p-4 shadow-sm">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3"
          >
            You&apos;re in! Welcome to EvoFit {tierLabel}.
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg text-gray-600 max-w-xl mx-auto">
            Follow these three steps to get up and running in under 10 minutes.
          </motion.p>
        </motion.div>

        {/* 3-step quick start */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-4 mb-12"
        >
          {onboardingSteps.map((item) => (
            <motion.div
              key={item.step}
              variants={fadeInUp}
              className={`flex items-center gap-5 p-5 rounded-2xl border ${item.color}`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-lg ${item.iconColor}`}
              >
                {item.step}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
              </div>
              <Link
                href={item.href}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                {item.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* OTO Section */}
        {oto && (
          <OtoSection
            oto={oto}
            loading={loading}
            onAccept={() => handleCheckout(oto!.toPriceId)}
            onDecline={scrollToLogin}
          />
        )}

        {isEnterprise && (
          <EnterpriseAddOnSection
            loading={loading}
            onAccept={() => handleCheckout('price_1TEwpdGo4HHYDfDVmtIVLSQo')}
            onDecline={scrollToLogin}
          />
        )}

        {/* Login CTA */}
        <motion.div
          id="login-cta"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center scroll-mt-20"
        >
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <LogIn className="h-5 w-5" />
            Log in to EvoFit
            <ArrowRight className="h-5 w-5" />
          </Link>

          <p className="mt-4 text-sm text-gray-400">
            Check your email for login instructions and your account details.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  )
}
