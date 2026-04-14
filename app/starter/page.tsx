'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import {
  Dumbbell,
  Users,
  Activity,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  Star,
  Sparkles,
  BadgeCheck,
  Target,
  Smartphone,
  Wifi,
  Trophy,
  Timer,
  TrendingUp,
} from 'lucide-react'

// ─── Scroll-triggered animation wrapper ───
function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Value Stack Item ───
function ValueStackItem({
  label,
  value,
  icon: Icon,
  delay = 0,
}: {
  label: string
  value: string
  icon: React.ElementType
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center justify-between py-3 border-b border-white/10 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>
        <span className="text-white/90 text-sm sm:text-base">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white/40 hidden sm:inline">{'·'.repeat(20)}</span>
        <span className="text-white/60 text-sm font-mono">{value}</span>
      </div>
    </motion.div>
  )
}

// ─── FAQ Item ───
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className="border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-colors"
    >
      <h4 className="text-white font-semibold text-lg mb-2">{question}</h4>
      <p className="text-white/60 leading-relaxed">{answer}</p>
    </motion.div>
  )
}

export default function StarterSalesPage() {
  return (
    <div
      className="min-h-screen bg-[#0A0A0F] text-white overflow-x-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ════════════════════════════════════════════════════════════════
          SECTION 1: HERO
          ════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#0a1020] to-[#0A0A0F]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            STARTER PLAN — $199 ONE-TIME
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 tracking-tight"
          >
            Your Coaching Platform.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-orange-400 bg-clip-text text-transparent">
              Forever. $199.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Stop paying $80/month for software you don&apos;t fully use. Get the essentials —{' '}
            <span className="text-white font-semibold">1,324 exercises</span>, client tracking,
            workout logging — and{' '}
            <span className="text-white font-semibold">own it forever</span>.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl shadow-[0_0_40px_rgba(249,115,22,0.3)] hover:shadow-[0_0_60px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:scale-105"
            >
              Get Started for $199
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-white/40 text-sm">
              One-time payment. No monthly fees. Ever.
            </p>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>14-day money-back</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>Instant access</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-orange-400" />
              <span>4,720 automated tests</span>
            </div>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-16"
          >
            <ChevronDown className="w-6 h-6 text-white/30 mx-auto animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 2: EPIPHANY BRIDGE STORY
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0d0d1a] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                Sound Familiar?
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4 leading-tight">
                &ldquo;I Was Drowning in{' '}
                <span className="text-blue-400">Spreadsheets</span> and Sticky Notes...&rdquo;
              </h2>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="space-y-6 text-white/70 leading-relaxed text-lg">
              <p>
                You became a personal trainer because you love coaching — not because you love
                managing files, hunting through notes, and manually tracking your clients&apos;
                progress in Google Sheets.
              </p>
              <p>
                But that&apos;s exactly where most new trainers end up.{' '}
                <span className="text-white font-semibold">
                  A different spreadsheet for each client. Workout plans buried in email threads.
                  Progress notes on paper.
                </span>{' '}
                It&apos;s a mess — and it makes you look less professional than you actually are.
              </p>
              <p className="text-white/50 italic border-l-2 border-blue-500/50 pl-6">
                &ldquo;I spent 3 hours writing a workout plan for a new client. She couldn&apos;t
                open the file format I sent. I had to start over.&rdquo;
              </p>
              <p>
                The expensive platforms — Everfit, TrueCoach — charge $80-200 every single month.
                When you only have 2 clients, that&apos;s{' '}
                <span className="text-white font-semibold">nearly $1,000/year</span> just to stay
                organized.
              </p>
              <p>
                There&apos;s a better way. EvoFit Starter gives you a{' '}
                <span className="text-blue-400 font-semibold">
                  professional coaching platform for $199 — once
                </span>
                . Not per month. Not per year. Once.
              </p>
              <p className="text-xl text-white font-semibold">
                Get organized today. Look professional from client one. Pay $199 and never again.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 3: VALUE STACK
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0a1020] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                The Value Stack
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4">
                Here&apos;s Everything You Get
              </h2>
              <p className="text-white/50 mt-4 text-lg">
                Everything below is included in your one-time $199 payment
              </p>
            </div>
          </AnimatedSection>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <ValueStackItem
              icon={Dumbbell}
              label="1,324 Exercises with Animated GIF Demos"
              value="$600/yr"
              delay={0}
            />
            <ValueStackItem
              icon={Users}
              label="Up to 5 Active Client Profiles"
              value="$400/yr"
              delay={0.05}
            />
            <ValueStackItem
              icon={Activity}
              label="Set-by-Set Workout Logging + Rest Timer"
              value="$300/yr"
              delay={0.1}
            />
            <ValueStackItem
              icon={Trophy}
              label="Automatic PR Detection + Confetti Celebration"
              value="$200/yr"
              delay={0.15}
            />
            <ValueStackItem
              icon={BarChart3}
              label="Body Composition Tracking (8 Metrics)"
              value="$400/yr"
              delay={0.2}
            />
            <ValueStackItem
              icon={Target}
              label="2 Active Fitness Goals with Progress Bars"
              value="$200/yr"
              delay={0.25}
            />
            <ValueStackItem
              icon={Smartphone}
              label="PWA — Install on iPhone/Android, No App Store"
              value="$300/yr"
              delay={0.3}
            />
            <ValueStackItem
              icon={Wifi}
              label="Offline Workout Logging (No Wi-Fi Needed)"
              value="$200/yr"
              delay={0.35}
            />
            <ValueStackItem
              icon={Shield}
              label="JWT Auth, Email Verification, Account Lockout"
              value="$300/yr"
              delay={0.4}
            />

            {/* Bonus */}
            <div className="mt-6 pt-6 border-t border-orange-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400 font-bold text-sm tracking-widest uppercase">
                  FREE BONUS
                </span>
              </div>
              <ValueStackItem
                icon={Timer}
                label="Multi-Line Progress Charts + Milestone Achievements"
                value="$300/yr"
                delay={0.45}
              />
            </div>

            {/* Total */}
            <AnimatedSection delay={0.5}>
              <div className="mt-8 pt-8 border-t border-white/20 text-center">
                <div className="text-white/50 text-lg mb-2">Total Annual Value</div>
                <div className="text-4xl sm:text-5xl font-black text-white/30 line-through mb-4">
                  $3,200/yr
                </div>
                <div className="text-sm text-white/50 mb-2">YOUR ONE-TIME PRICE</div>
                <div className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                  $199
                </div>
                <div className="text-white/50 mt-2 text-lg">
                  One time. Not per year.{' '}
                  <span className="font-bold text-white">Forever.</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 4: SCREENSHOTS
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0d0d1a] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                See It In Action
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4">
                Professional Tools, $199 Price Tag
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatedSection delay={0.1}>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-blue-900/30 to-blue-800/10 flex items-center justify-center relative overflow-hidden">
                  <img
                    src="/images/marketing/exercises-library.png"
                    alt="Exercise Library — 1,324 exercises with animated GIF demonstrations"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement
                      t.style.display = 'none'
                      t.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center">
                    <Dumbbell className="w-16 h-16 text-blue-400/30" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2">Exercise Library</h3>
                  <p className="text-white/60 text-sm">
                    1,324 exercises with animated GIF demos. Filter by body part, equipment, muscle
                    group, and difficulty simultaneously.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-orange-900/30 to-orange-800/10 flex items-center justify-center relative overflow-hidden">
                  <img
                    src="/images/marketing/workout-tracker.png"
                    alt="Workout Tracker — real-time set logging with PR detection"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement
                      t.style.display = 'none'
                      t.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center">
                    <Activity className="w-16 h-16 text-orange-400/30" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2">Workout Tracker</h3>
                  <p className="text-white/60 text-sm">
                    Real-time set-by-set logging with automatic PR detection, rest timers, and
                    adherence scoring. Works offline too.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.3} className="md:col-span-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-green-900/30 to-green-800/10 flex items-center justify-center relative overflow-hidden">
                  <img
                    src="/images/marketing/trainer-dashboard.png"
                    alt="Trainer Dashboard — client overview and activity feed"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement
                      t.style.display = 'none'
                      t.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center">
                    <BarChart3 className="w-16 h-16 text-green-400/30" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2">Trainer Dashboard</h3>
                  <p className="text-white/60 text-sm">
                    Your command center. See all clients, recent activity, upcoming sessions, and
                    progress at a glance.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 5: WHO IT'S FOR
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0a1020] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                Is This For You?
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4">
                Starter is Built For Trainers Like You
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                check: true,
                text: 'You have 1–5 clients and want professional tools without a professional price tag',
              },
              {
                check: true,
                text: "You coach part-time and don't want $80/month overhead eating your margins",
              },
              {
                check: true,
                text: "You're in your first year of business and proving the model before scaling",
              },
              {
                check: true,
                text: "You want to look professional from client #1 — not \"spreadsheet amateur\"",
              },
              {
                check: true,
                text: 'You want offline workout logging so the gym Wi-Fi being slow never matters',
              },
              {
                check: true,
                text: 'You want to pay once and own your platform — forever, with no renewal anxiety',
              },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.05}>
                <div className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/20 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-white/80 text-sm leading-relaxed">{item.text}</span>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={0.4}>
            <div className="mt-8 p-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-center">
              <p className="text-white/70 italic text-lg">
                &ldquo;Every serious trainer we know started with Starter. Most upgrade within 90
                days — not because Starter is bad, but because they&apos;re growing. That&apos;s
                the point.&rdquo;
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 6: OBJECTION HANDLER
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0d0d1a] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                We Know What You&apos;re Thinking
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4">
                Common Concerns, Honest Answers
              </h2>
            </div>
          </AnimatedSection>

          <div className="space-y-6">
            <AnimatedSection delay={0.1}>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl mb-3">
                      &ldquo;Can I upgrade later?&rdquo;
                    </h3>
                    <p className="text-white/70 leading-relaxed">
                      Yes. Any time you outgrow Starter, you purchase the Professional or Enterprise
                      upgrade and your existing data carries over. You never lose what you&apos;ve
                      built. You pay the difference — not the full price again.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl mb-3">
                      &ldquo;What if the platform shuts down?&rdquo;
                    </h3>
                    <p className="text-white/70 leading-relaxed">
                      EvoFit runs on Vercel, Neon PostgreSQL, and Upstash Redis — the same
                      production-grade infrastructure used by thousands of companies. You can export
                      all your data in CSV format at any time. Your clients&apos; data belongs to
                      you.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 7: FAQ
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0a1020] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                FAQ
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4">
                Got Questions?
              </h2>
            </div>
          </AnimatedSection>

          <div className="space-y-4">
            <FAQItem
              question="I'm brand new to personal training. Is Starter enough to get started?"
              answer="Absolutely. Starter was designed for trainers with 1-5 clients. You get the full exercise library (1,324 exercises with animated demos), workout logging, client management, progress tracking, and a PWA-installable mobile experience. It's everything you need in year one — without paying year-one subscription prices."
            />
            <FAQItem
              question="What does 'one-time payment' mean? Are there hidden fees?"
              answer="It means exactly what it says. You pay $199 once and you own access to the Starter plan forever. No monthly fees, no annual renewals, no hidden charges. The only optional cost is if you decide to upgrade to Professional or Enterprise later."
            />
            <FAQItem
              question="Can I really manage 5 clients with this?"
              answer="Yes. Each client gets their own profile with fitness history, goals, status tracking, private trainer notes, and workout logs. You can view your full roster, track adherence, and see progress charts — all in one place."
            />
            <FAQItem
              question="How does the offline mode work?"
              answer="EvoFit uses IndexedDB (browser local storage) to save workout data locally when you're offline. Your clients can log sets, reps, and weights in the gym even without Wi-Fi. When their device reconnects, the sync manager automatically uploads everything to the server. No lost data."
            />
            <FAQItem
              question="What happens when I hit 5 clients and want to grow?"
              answer="Upgrade to Professional ($3$39$199 one-time) for unlimited clients, the full Program Builder, ACWR analytics, and scheduling features. Your Starter data migrates seamlessly. You pay the difference — not the full price again. Growing your business shouldn't mean rebuilding your platform."
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 8: GUARANTEE
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0d0d1a] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-8 sm:p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                14-Day Money-Back Guarantee
              </h2>
              <p className="text-white/60 text-lg leading-relaxed max-w-xl mx-auto mb-6">
                Try EvoFit Starter for 14 days. If you don&apos;t love it — if it doesn&apos;t
                make you look more professional and save you time — email us and we&apos;ll refund
                every penny. No questions. No hassle. No risk.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 font-semibold">
                <Shield className="w-5 h-5" />
                100% Risk-Free Purchase
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 9: FINAL CTA
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0a1020] to-[#0A0A0F]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/15 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Ready to Own Your{' '}
              <span className="text-blue-400">Coaching Platform</span>?
            </h2>
            <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto">
              $199. One time. No subscriptions. Start serving clients today.
            </p>

            <Link
              href="/register"
              className="inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xl rounded-xl shadow-[0_0_40px_rgba(249,115,22,0.3)] hover:shadow-[0_0_60px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:scale-105"
            >
              Get Starter for $199
              <ArrowRight className="w-6 h-6" />
            </Link>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                14-day money-back guarantee
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Instant access
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                No monthly fees
              </div>
            </div>

            <p className="mt-8 text-white/30 text-sm">
              Or{' '}
              <Link href="/pricing" className="text-blue-400 hover:text-blue-300 underline">
                compare all tiers →
              </Link>
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer spacer */}
      <div className="h-16 bg-[#0A0A0F]" />
    </div>
  )
}
