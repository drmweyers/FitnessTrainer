'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Sparkles,
  Brain,
  TrendingUp,
  AlertTriangle,
  Bell,
  ArrowRight,
  User,
  Users,
  ClipboardList,
  LogIn,
  X,
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

const saasHighlights = [
  {
    icon: Brain,
    title: 'AI Workout Generator',
    description:
      'Generate a full balanced workout from 1,344 exercises in under 5 seconds — filter by equipment, body part, and difficulty.',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: TrendingUp,
    title: 'RPE-Based Progression',
    description:
      'The system reads your clients\' actual RPE data and tells you exactly when to increase weight, add reps, or deload — per exercise.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: AlertTriangle,
    title: 'Plateau Detection',
    description:
      'Automatically flags exercises with no progress in 4+ weeks and suggests variation changes before your client stalls.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Bell,
    title: 'Push Notifications',
    description:
      'Browser-based web push to remind clients of scheduled workouts, milestones, and program updates — no app store required.',
    color: 'bg-purple-50 text-purple-600',
  },
]

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

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const tier = searchParams.get('tier') ?? 'professional'
  const tierLabel = TIER_LABELS[tier.toLowerCase()] ?? 'EvoFit'

  // Phase A = upsell shown, Phase B = onboarding shown
  const [phase, setPhase] = useState<'upsell' | 'onboarding'>('upsell')

  const handleAcceptUpsell = () => {
    // In production this would POST to create a Stripe subscription checkout.
    // For now we transition to onboarding.
    setPhase('onboarding')
  }

  const handleDeclineUpsell = () => {
    setPhase('onboarding')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="EvoFit" width={36} height={36} className="rounded-lg" />
          <span className="font-bold text-lg tracking-tight">EvoFit Trainer</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'upsell' ? (
          /* ─────────────────────────────────────
             PHASE A — Upsell
          ───────────────────────────────────── */
          <motion.div
            key="upsell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto px-4 py-12 sm:py-20"
          >
            {/* Confirmation */}
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
                Your account is ready. One more thing before you get started&hellip;
              </motion.p>
            </motion.div>

            {/* Upsell card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white rounded-3xl shadow-xl border border-blue-100 overflow-hidden"
            >
              {/* Card header */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="h-6 w-6 text-blue-200" />
                  <span className="text-sm font-semibold uppercase tracking-widest text-blue-200">
                    One-Time Offer
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-1">
                  Unlock AI Workout Generation + Progression Suggestions
                </h2>
                <p className="text-blue-100 text-lg font-semibold">$39.99/month</p>
              </div>

              {/* Body */}
              <div className="px-8 py-8">
                <p className="text-gray-600 text-base mb-6">
                  Most trainers add the AI layer within 30 days. Save yourself the upgrade later —
                  stack it now while you&apos;re setting up.
                </p>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {saasHighlights.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div className={`p-2 rounded-lg flex-shrink-0 ${item.color}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm mb-1">{item.title}</p>
                        <p className="text-gray-500 text-xs leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <button
                    onClick={handleAcceptUpsell}
                    className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg"
                  >
                    <Sparkles className="h-5 w-5" />
                    Yes, add the AI layer — $39.99/month
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={handleDeclineUpsell}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    No thanks, I&apos;ll start without AI
                  </button>
                </div>

                <p className="mt-5 text-center text-xs text-gray-400">
                  You can add this any time from your account settings. It stacks with your existing
                  tier.
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* ─────────────────────────────────────
             PHASE B — Onboarding
          ───────────────────────────────────── */
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto px-4 py-12 sm:py-20"
          >
            {/* Celebration header */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center mb-12"
            >
              <motion.div variants={fadeInUp} className="flex justify-center mb-5">
                <div className="bg-blue-100 rounded-full p-4 shadow-sm">
                  <CheckCircle2 className="h-12 w-12 text-blue-500" />
                </div>
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3"
              >
                You&apos;re set. Let&apos;s get your first program built.
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
              className="space-y-4 mb-10"
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

            {/* Login CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center"
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
        )}
      </AnimatePresence>
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
