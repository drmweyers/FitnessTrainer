'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  HelpCircle,
  Shield,
  CheckCircle2,
  Users,
  BarChart3,
  Zap,
  Lock,
  Building2,
  Flag,
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="EvoFit" width={36} height={36} className="rounded-lg" />
          <span className="font-bold text-lg tracking-tight">EvoFit Trainer</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Headline */}
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              No pressure. The door&apos;s still open.
            </h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Before you go — here&apos;s the one thing most trainers tell us they wish they&apos;d
              known before they walked away from a one-time deal.
            </p>
          </motion.div>

          {/* Value reminder block */}
          <motion.div
            variants={fadeInUp}
            className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4">
              <p className="font-bold text-base">What you&apos;re getting with Enterprise — $399 once:</p>
            </div>
            <ul className="divide-y divide-gray-100">
              {[
                { icon: Users, text: 'Unlimited clients — no roster cap, ever. No per-client fees.' },
                { icon: BarChart3, text: 'Full program builder — 8 program types, 7 set types, RPE/RIR/Tempo' },
                { icon: Zap, text: 'ACWR training load monitoring — NFL/NBA-level analytics' },
                { icon: Building2, text: 'Admin dashboard — user management, platform-wide stats' },
                { icon: Flag, text: 'Feature flags API — enable features per user without code' },
                { icon: Lock, text: 'Security audit trail — every login, role change, and event logged' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <li key={i} className="px-6 py-3 flex items-center gap-3">
                    <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item.text}</span>
                  </li>
                )
              })}
            </ul>
            <div className="px-6 py-4 bg-orange-50 border-t border-orange-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Comparable platforms charge:</span>
                <span className="text-base font-bold text-red-600 line-through">$500–$1,800/yr</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-semibold text-gray-700">EvoFit Enterprise:</span>
                <span className="text-2xl font-extrabold text-orange-600">$399 once</span>
              </div>
            </div>
          </motion.div>

          {/* Guarantee callout */}
          <motion.div
            variants={fadeInUp}
            className="mb-8 p-5 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3"
          >
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-900 mb-1">14-Day Money-Back Guarantee</p>
              <p className="text-sm text-green-800">
                Try EvoFit for 14 days. If it&apos;s not the right fit, email us for a full
                refund — no questions, no hassle. There&apos;s no risk in trying.
              </p>
            </div>
          </motion.div>

          {/* Primary CTA */}
          <motion.div variants={fadeInUp} className="flex flex-col gap-3 mb-8">
            <Link
              href="/enterprise"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
            >
              Get Enterprise — $399 One-Time
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all"
            >
              Compare All Tiers
            </Link>
          </motion.div>

          {/* Soft support link */}
          <motion.div variants={fadeInUp} className="text-center">
            <a
              href="mailto:support@evofittrainer.com"
              className="inline-flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              Have a question before buying? Email support.
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
