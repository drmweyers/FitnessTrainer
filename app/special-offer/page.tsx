'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Brain,
  TrendingUp,
  Bell,
  Fingerprint,
  ArrowRight,
} from 'lucide-react'

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function useCountdown(initialMinutes: number) {
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60)

  useEffect(() => {
    if (totalSeconds <= 0) return
    const interval = setInterval(() => {
      setTotalSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [totalSeconds])

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return {
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    expired: totalSeconds <= 0,
  }
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
}

// ─── Feature Data ─────────────────────────────────────────────────────────────

const aiFeatures = [
  {
    icon: Brain,
    title: 'AI Workout Generator',
    description:
      'Auto-create a full balanced workout from 1,344 exercises in under 5 seconds. Filter by equipment, difficulty, and focus area.',
    color: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    iconBg: 'bg-purple-500/20',
  },
  {
    icon: TrendingUp,
    title: 'RPE-Based Progression',
    description:
      'Automatically suggest next session weights based on your clients\u2019 actual RPE data \u2014 increase weight, add reps, maintain, or deload per exercise.',
    color: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    iconBg: 'bg-blue-500/20',
  },
  {
    icon: Zap,
    title: 'Plateau Detection + Deload Suggestions',
    description:
      'Flags stalled exercises after 4+ weeks without progress and suggests variation changes or deload timing before your client notices.',
    color: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
    iconBg: 'bg-orange-500/20',
  },
  {
    icon: Bell,
    title: 'Push Notifications + Biometric Login',
    description:
      'Web push reminders for scheduled workouts and milestones. Face ID / Touch ID login for an instant, native-app-like experience.',
    color: 'bg-green-500/15 border-green-500/30 text-green-400',
    iconBg: 'bg-green-500/20',
  },
]

// ─── Checkout Handler ─────────────────────────────────────────────────────────

async function handleAddOnCheckout() {
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: 'saas-addon' }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    }
  } catch {
    window.location.href = '/pricing'
  }
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function SpecialOfferPage() {
  const countdown = useCountdown(15)

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── 1. STICKY URGENCY BAR ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 shadow-lg shadow-red-900/30">
        <div className="max-w-5xl mx-auto px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-200 animate-pulse flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold tracking-wide text-white uppercase">
              One-Time Offer — This page will not be shown again
            </span>
          </div>
          <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1">
            <Clock className="w-4 h-4 text-yellow-200 flex-shrink-0" />
            <span className="font-mono text-lg sm:text-xl font-extrabold tabular-nums text-white">
              {countdown.minutes}:{countdown.seconds}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. HERO ───────────────────────────────────────────────────────── */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/60 via-gray-950 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-8 sm:pb-12 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 text-sm font-medium tracking-wide">
              <Zap className="w-4 h-4" />
              WAIT! Special One-Time Offer
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="mt-6 sm:mt-8 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            Before You Go&hellip;{' '}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Supercharge Your EvoFit with AI
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            You just unlocked the platform. Now let the AI handle the programming so you can focus on{' '}
            <span className="text-white font-semibold">what actually matters — coaching your clients.</span>
          </motion.p>
        </div>
      </section>

      {/* ── 3. WHAT YOU GET ───────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.h2
            className="text-xl sm:text-2xl font-bold mb-8 text-center text-white"
            custom={0}
            variants={fadeUp}
          >
            4 AI Features That Change How You Coach
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {aiFeatures.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  className={`p-5 rounded-2xl border ${feature.color} backdrop-blur-sm`}
                  custom={i + 1}
                  variants={fadeUp}
                >
                  <div className={`w-10 h-10 rounded-xl ${feature.iconBg} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </section>

      {/* ── 4. VALUE ANCHORING ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <motion.div
            className="text-center p-6 sm:p-10 rounded-2xl bg-gray-900/70 border border-gray-800 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-gray-400 text-sm sm:text-base mb-1">
              AI workout tools on competing platforms cost{' '}
              <span className="text-white font-bold">$89+/month</span>
            </p>
            <p className="text-gray-400 text-sm sm:text-base mb-2">
              Manual progression calculations:{' '}
              <span className="text-white font-bold">30+ minutes per client per week</span>
            </p>
            <p className="text-gray-500 text-sm mb-6">
              At 10 clients, that&rsquo;s 5+ hours every week building programs and doing progression math.
            </p>

            <div className="flex flex-col items-center gap-2">
              <p className="text-gray-500 text-sm">Competitors charge:</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-500 line-through decoration-red-400">
                  $89/month
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-2">Your price today:</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-extrabold text-green-400">
                  $49
                </span>
                <span className="text-xl text-gray-400 font-semibold">/month</span>
              </div>
              <p className="text-green-400/80 text-sm font-medium mt-1">
                That&rsquo;s 45% less than competitors — and you already own the platform.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 5. WHAT TRAINERS SAY ──────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            custom={0}
            variants={fadeUp}
          >
            {[
              {
                quote: 'I generated my first AI workout in under 30 seconds. Now I use it as the baseline and spend my time on the client-specific tweaks.',
                name: 'Marcus T.',
                role: 'Online S&C Coach',
              },
              {
                quote: 'The RPE progression suggestions are insane. It knows when my clients are coasting and when they need to back off — before I even check in.',
                name: 'Jenna R.',
                role: 'Personal Trainer, 14 clients',
              },
              {
                quote: 'Plateau detection caught a client stalling on bench press 3 weeks before they would have complained. That is proactive coaching.',
                name: 'David K.',
                role: 'Strength Coach',
              },
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                className="p-5 rounded-2xl bg-gray-900/50 border border-gray-800"
                custom={i + 1}
                variants={fadeUp}
              >
                <p className="text-gray-300 text-sm leading-relaxed mb-4 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <p className="text-white font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-gray-500 text-xs">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── 6. PROGRESSION CHECKLIST ─────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          className="p-6 sm:p-8 rounded-2xl bg-gray-900/60 border border-purple-800/40"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg font-bold text-white mb-4 text-center">
            6 Progression Rules, Powered by Real RPE Data
          </h3>
          <div className="space-y-3">
            {[
              'RPE 6–7 + hitting all reps → increase weight next session',
              'RPE 8+ → increase reps before adding load',
              'All sets at RPE 10 → reduce weight, preserve quality',
              'More than 50% of reps failed → trigger deload week',
              'RPE below 6 consistently → double the weight increment',
              'No progress in 4+ weeks → variation change or deload suggested',
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-4 text-center">
            Confidence-rated: High / Medium / Low based on data volume (requires 3+ sets)
          </p>
        </motion.div>
      </section>

      {/* ── 7. CTA ────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Countdown reminder */}
          {!countdown.expired && (
            <div className="flex items-center justify-center gap-2 mb-6 text-orange-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-semibold">
                Offer expires in {countdown.minutes}:{countdown.seconds}
              </span>
            </div>
          )}

          <button
            onClick={handleAddOnCheckout}
            className="w-full sm:w-auto px-10 sm:px-14 py-5 sm:py-6 h-auto text-base sm:text-lg font-extrabold bg-green-500 hover:bg-green-600 text-white shadow-xl shadow-green-500/25 transition-all duration-200 hover:shadow-green-500/40 hover:scale-[1.02] rounded-xl inline-flex items-center justify-center gap-3"
          >
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
            Yes, Add AI Features — $49/month
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="mt-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-4"
            >
              No thanks, I&rsquo;ll program manually
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── 8. GUARANTEE ──────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <motion.div
          className="p-6 sm:p-8 rounded-2xl bg-gray-900/60 border border-gray-800 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-12 h-12 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
            Cancel Anytime. No Lock-In Contracts.
          </h3>
          <p className="text-sm sm:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
            The SaaS Add-on is month-to-month. Cancel at any time from your account settings — no penalties, no lock-in, no questions asked.
            Your base tier platform and all your data remain 100% intact.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {[
              { icon: CheckCircle2, text: 'Cancel anytime' },
              { icon: CheckCircle2, text: 'No lock-in contracts' },
              { icon: CheckCircle2, text: 'Base tier data always safe' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Icon className="h-4 w-4 text-green-500" />
                {text}
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  )
}
