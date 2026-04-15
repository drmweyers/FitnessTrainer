'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Download,
  CheckCircle2,
  Lock,
  Star,
  Dumbbell,
  BarChart3,
  ClipboardList,
  Target,
  ArrowRight,
  Shield,
  Users,
  Zap,
} from 'lucide-react'

/* ─── Animation Variants ─────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

/* ─── Bullet Points ──────────────────────────────── */
const bulletPoints = [
  {
    icon: ClipboardList,
    text: 'The 6-phase periodization framework elite S&C coaches use to keep clients progressing for 52 weeks without plateauing',
  },
  {
    icon: BarChart3,
    text: 'How to use ACWR (Acute:Chronic Workload Ratio) to detect overtraining before it kills your clients\u2019 momentum',
  },
  {
    icon: Target,
    text: 'RPE vs. percentage-based loading — when each method wins, and how to blend them for every client type from beginner to advanced',
  },
  {
    icon: Dumbbell,
    text: 'A complete 12-week hypertrophy block template: sets, reps, tempo, RPE targets, and deload timing — ready to assign today',
  },
]

/* ─── Testimonial ────────────────────────────────── */
const testimonial = {
  quote:
    'This blueprint completely changed how I structure programs. I went from guessing at progressions to having a systematic framework. My client retention jumped from 60% to 94% in 6 months.',
  name: 'Jordan T.',
  title: 'CSCS, Online Performance Coach',
}

/* ═══════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════ */
export default function FreeBlueprintPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden">
      {/* ── HERO ── */}
      <section className="relative">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-[#0A0A0F] to-[#0A0A0F]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(37,99,235,0.18)_0%,_transparent_60%)]" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-28 pb-12 sm:pb-16">
          <div className="text-center">
            {/* Back link */}
            <div className="mb-8 flex justify-center">
              <Link
                href="/get-started"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Back to EvoFit
              </Link>
            </div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/25 border border-blue-500/40 text-blue-300 text-sm font-semibold tracking-wide">
                <Download className="w-4 h-4" />
                FREE DOWNLOAD
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="mt-6 sm:mt-8 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              The Trainer&apos;s{' '}
              <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                Programming Blueprint
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="mt-5 text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              How elite trainers build periodized programs that keep clients for{' '}
              <span className="text-white font-semibold">years — not weeks.</span>{' '}
              The exact framework used by coaches who charge $500+/month per client.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ── CONTENT + FORM ── */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left: Bullets + Form */}
          <div className="order-2 lg:order-1">
            {/* What You'll Learn */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              <motion.h2
                className="text-xl sm:text-2xl font-bold mb-7 text-white"
                custom={0}
                variants={fadeUp}
              >
                What&apos;s inside the blueprint
              </motion.h2>

              <div className="space-y-5">
                {bulletPoints.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={i}
                      className="flex items-start gap-4"
                      custom={i + 1}
                      variants={fadeUp}
                    >
                      <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{item.text}</p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Email Capture Form */}
            <motion.div
              className="mt-10 p-7 sm:p-8 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {!submitted ? (
                <>
                  <h3 className="text-lg font-bold mb-1 text-white">Get your free copy now</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Instant access — no credit card required.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Your first name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 text-sm transition-colors"
                    />
                    <input
                      type="email"
                      placeholder="Your best email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 text-sm transition-colors"
                    />
                    <button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Send Me the Blueprint
                    </button>
                  </form>

                  <p className="mt-3 text-xs text-gray-600 text-center">
                    We respect your privacy. Unsubscribe at any time.
                  </p>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center py-4"
                >
                  <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Blueprint on its way, {name}!
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    Check your inbox at <span className="text-white font-medium">{email}</span>.
                    The blueprint covers ACWR, periodization, and RPE — EvoFit Enterprise has all of
                    this built in. Admin dashboard, audit trail, feature flags, and every coaching
                    tool — $399, once.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Link href="/enterprise">
                      <button className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-500/25">
                        Get Enterprise — $399 One-Time <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                    <Link href="/pricing">
                      <button className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white/70 font-semibold text-sm px-6 py-3 rounded-xl transition-all">
                        Compare All Tiers
                      </button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Right: Blueprint Mockup */}
          <motion.div
            className="order-1 lg:order-2 flex justify-center"
            initial={{ opacity: 0, x: 40, rotateY: -8 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-8 bg-blue-600/12 rounded-full blur-3xl" />

              {/* Blueprint Cover */}
              <div className="relative w-64 sm:w-72 md:w-80 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/40">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-[#0A0A2A]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.07)_0%,_transparent_50%)]" />

                {/* Grid texture */}
                <div
                  className="absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-between p-7 text-center">
                  {/* Top accent */}
                  <div className="w-16 h-1 rounded-full bg-orange-500/80" />

                  {/* Main */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                      <Dumbbell className="w-8 h-8 text-blue-200" />
                    </div>

                    <div>
                      <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-blue-300 font-medium mb-2">
                        The
                      </p>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight">
                        TRAINER&apos;S
                        <br />
                        PROGRAMMING
                        <br />
                        BLUEPRINT
                      </h3>
                    </div>

                    <div className="w-12 h-px bg-blue-400/40" />

                    <div className="space-y-1.5">
                      {['Periodization', 'ACWR Analytics', 'RPE Programming'].map((tag) => (
                        <div
                          key={tag}
                          className="text-xs text-blue-200/70 bg-white/5 border border-white/10 rounded-full px-3 py-1 font-medium"
                        >
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom branding */}
                  <div className="flex items-center gap-1.5 text-blue-300/60">
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span className="text-[10px] sm:text-xs font-semibold tracking-wide">
                      EvoFit Trainer
                    </span>
                  </div>
                </div>

                {/* Spine shadow */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/30 to-transparent" />
              </div>

              {/* Floating tag */}
              <motion.div
                className="absolute -top-4 -right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-orange-500/40"
                animate={{ rotate: ['-3deg', '3deg', '-3deg'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                style={{ rotate: '-3deg' }}
              >
                FREE
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="relative border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {/* Stat 1 */}
            <motion.div className="flex flex-col items-center gap-3" custom={0} variants={fadeUp}>
              <div className="w-11 h-11 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Join 500+ fitness professionals</p>
                <p className="text-xs text-gray-500 mt-0.5">who have downloaded the blueprint</p>
              </div>
            </motion.div>

            {/* Stat 2 */}
            <motion.div className="flex flex-col items-center gap-3" custom={1} variants={fadeUp}>
              <div className="w-11 h-11 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center">
                <Lock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Your information is secure</p>
                <p className="text-xs text-gray-500 mt-0.5">256-bit SSL encrypted</p>
              </div>
            </motion.div>

            {/* Stat 3 */}
            <motion.div className="flex flex-col items-center gap-3" custom={2} variants={fadeUp}>
              <div className="w-11 h-11 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">No spam. Ever.</p>
                <p className="text-xs text-gray-500 mt-0.5">One email, then only when you ask</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section className="border-t border-white/5 bg-[#0D0D14] py-14 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center gap-0.5 mb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 text-orange-400 fill-orange-400" />
              ))}
            </div>
            <blockquote className="text-gray-300 text-lg sm:text-xl leading-relaxed italic mb-6">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <div>
              <p className="font-semibold text-white">{testimonial.name}</p>
              <p className="text-gray-500 text-sm mt-0.5">{testimonial.title}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PLATFORM BRIDGE CTA ── */}
      <section className="py-16 sm:py-20 bg-[#0A0A0F] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.08)_0%,_transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300 font-medium">Put the blueprint into practice</span>
            </div>

            <h2 className="font-extrabold text-3xl sm:text-4xl text-white mb-4">
              The blueprint is the map.
              <br />
              <span className="text-blue-400">EvoFit Trainer is the vehicle.</span>
            </h2>

            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              Everything in the blueprint — ACWR monitoring, RPE prescriptions, periodization
              blocks, deload weeks — is built into EvoFit Trainer. Enterprise adds the admin layer
              platforms charge $500+/year for. Own it all for $399, once.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/enterprise">
                <button className="group inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base sm:text-lg px-8 py-4 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.02]">
                  Get Enterprise — $399
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/pricing">
                <button className="inline-flex items-center gap-2 border border-white/20 text-white/70 hover:bg-white/8 font-semibold text-base sm:text-lg px-8 py-4 rounded-xl transition-all duration-300">
                  Compare All Tiers
                </button>
              </Link>
            </div>

            <p className="mt-4 text-xs text-gray-600">
              No monthly fees · Pay once · Own forever · 14-day money-back guarantee
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 bg-[#080810] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white text-sm">EvoFit Trainer</span>
          </div>
          <p className="text-gray-600 text-xs">
            © 2026 EvoFit Trainer · Unsubscribe at any time
          </p>
          <Link href="/get-started" className="text-blue-500/60 hover:text-blue-400 text-xs transition-colors">
            Back to EvoFit →
          </Link>
        </div>
      </footer>
    </div>
  )
}
