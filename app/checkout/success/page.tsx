'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  ArrowRight,
  User,
  Users,
  ClipboardList,
  LogIn,
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

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const tier = searchParams.get('tier') ?? 'professional'
  const tierLabel = TIER_LABELS[tier.toLowerCase()] ?? 'EvoFit'

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
