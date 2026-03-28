'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, HelpCircle, ShoppingCart } from 'lucide-react'

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

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/logo.svg" alt="EvoFit" width={36} height={36} className="rounded-lg" />
          <span className="font-bold text-lg tracking-tight">EvoFit Trainer</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-20 sm:py-28 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Icon */}
          <motion.div variants={fadeInUp} className="flex justify-center mb-6">
            <div className="bg-gray-100 rounded-full p-5 shadow-sm">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4"
          >
            Changed your mind?
          </motion.h1>

          {/* Body */}
          <motion.p variants={fadeInUp} className="text-lg text-gray-600 mb-10 max-w-md mx-auto">
            No worries — your cart is saved. Come back any time and pick up right where you left
            off. No pressure, no expiry.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Pricing
            </Link>

            <a
              href="mailto:support@evofittrainer.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all"
            >
              <HelpCircle className="h-5 w-5 text-gray-400" />
              Have questions?
            </a>
          </motion.div>

          {/* Soft reassurance */}
          <motion.p variants={fadeInUp} className="mt-10 text-sm text-gray-400">
            Starter starts at $49 one-time &mdash; no monthly fees, no per-client charges, ever.{' '}
            <Link href="/" className="text-blue-500 hover:text-blue-600 underline">
              Learn more
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
