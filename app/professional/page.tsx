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
  Calendar,
  Crown,
  TrendingUp,
  Download,
  Tag,
  ClipboardList,
  DollarSign,
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
  isHighlight = false,
}: {
  label: string
  value: string
  icon: React.ElementType
  delay?: number
  isHighlight?: boolean
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
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isHighlight ? 'bg-orange-500/20' : 'bg-blue-600/30'
          }`}
        >
          <Icon className={`w-4 h-4 ${isHighlight ? 'text-orange-400' : 'text-blue-400'}`} />
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

export default function ProfessionalSalesPage() {
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-blue-600/20 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          {/* Most Popular Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-sm font-bold mb-8"
          >
            <Crown className="w-4 h-4" />
            MOST POPULAR — PROFESSIONAL PLAN
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 tracking-tight"
          >
            Run a Professional Coaching Business.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-orange-400 bg-clip-text text-transparent">
              Own It Forever.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Unlimited clients, the full program builder, ACWR analytics, and scheduling —
            everything a full-time trainer needs in one platform,{' '}
            <span className="text-white font-semibold">one price</span>.
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
              Upgrade to Professional — $299
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-white/40 text-sm">
              One-time payment. Unlimited clients. No per-client fees. Ever.
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
              <Users className="w-4 h-4 text-blue-400" />
              <span>Unlimited clients</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-orange-400" />
              <span>Break even in month 2</span>
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
          SECTION 2: COST COMPARISON
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0d0d1a] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                The Math Doesn&apos;t Lie
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4">
                Break Even in{' '}
                <span className="text-green-400">Month 2</span>
              </h2>
              <p className="text-white/60 mt-4 text-lg">
                The competition charges $80-200/month. EvoFit Professional: $299. Once.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Competitor card */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8">
                <div className="text-red-400 font-bold text-sm tracking-widest uppercase mb-4">
                  Everfit / TrueCoach / TrainHeroic
                </div>
                <div className="space-y-3 text-white/60">
                  <div className="flex justify-between">
                    <span>Monthly cost</span>
                    <span className="text-red-400 font-bold">$80-150/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year 1</span>
                    <span className="text-red-400 font-bold">$960-1,800</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year 2</span>
                    <span className="text-red-400 font-bold">$1,920-3,600</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year 5</span>
                    <span className="text-red-400 font-bold">$4,800-9,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price increases</span>
                    <span className="text-red-400 font-bold">Guaranteed</span>
                  </div>
                </div>
              </div>

              {/* EvoFit card */}
              <div className="bg-green-500/5 border border-green-500/30 rounded-2xl p-8">
                <div className="text-green-400 font-bold text-sm tracking-widest uppercase mb-4">
                  EvoFit Professional
                </div>
                <div className="space-y-3 text-white/60">
                  <div className="flex justify-between">
                    <span>One-time cost</span>
                    <span className="text-green-400 font-bold">$299</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year 1</span>
                    <span className="text-green-400 font-bold">$299</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year 2</span>
                    <span className="text-green-400 font-bold">$0 more</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year 5</span>
                    <span className="text-green-400 font-bold">$0 more</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price increases</span>
                    <span className="text-green-400 font-bold">Never</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center p-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
              <p className="text-2xl font-black text-white mb-2">
                You save{' '}
                <span className="text-green-400">$5,701</span> over 5 years vs a $99.99/month
                platform
              </p>
              <p className="text-white/50">
                At Everfit&apos;s standard rate, EvoFit Professional pays for itself by month 2.
                Everything after is pure profit.
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
                Everything in Professional
              </h2>
              <p className="text-white/50 mt-4 text-lg">
                The complete coaching platform — one price, forever
              </p>
            </div>
          </AnimatedSection>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <ValueStackItem
              icon={Users}
              label="Unlimited Active Clients — No Roster Cap, Ever"
              value="$1,200/yr"
              delay={0}
            />
            <ValueStackItem
              icon={ClipboardList}
              label="Full Program Builder — 8 Program Types, 7 Set Types"
              value="$800/yr"
              delay={0.05}
            />
            <ValueStackItem
              icon={Activity}
              label="RPE, RIR & Tempo Prescriptions Per Set"
              value="$400/yr"
              delay={0.1}
            />
            <ValueStackItem
              icon={Zap}
              label="Superset + Circuit Support (A/B/C Grouping)"
              value="$300/yr"
              delay={0.15}
            />
            <ValueStackItem
              icon={Target}
              label="Deload Week Planning + Template Library"
              value="$400/yr"
              delay={0.2}
            />
            <ValueStackItem
              icon={BarChart3}
              label="ACWR Training Load Monitoring (NFL/NBA-Level Analytics)"
              value="$600/yr"
              delay={0.25}
            />
            <ValueStackItem
              icon={Calendar}
              label="5 Appointment Types + Online Session Meeting Links"
              value="$400/yr"
              delay={0.3}
            />
            <ValueStackItem
              icon={Download}
              label="iCal Export + Subscribable Calendar Feed"
              value="$200/yr"
              delay={0.35}
            />
            <ValueStackItem
              icon={BarChart3}
              label="Analytics Reports — Weekly, Monthly, Quarterly (PDF + CSV)"
              value="$500/yr"
              delay={0.4}
            />
            <ValueStackItem
              icon={Tag}
              label="Unlimited Color Tags + Tag-Based Bulk Assignment"
              value="$300/yr"
              delay={0.45}
            />
            <ValueStackItem
              icon={Users}
              label="Trainer Feedback on Client Sessions"
              value="$200/yr"
              delay={0.5}
            />

            {/* Bonus — Everything in Starter */}
            <div className="mt-6 pt-6 border-t border-orange-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400 font-bold text-sm tracking-widest uppercase">
                  PLUS EVERYTHING IN STARTER
                </span>
              </div>
              <ValueStackItem
                icon={Dumbbell}
                label="1,344 Exercises with GIFs + All Starter Features + All Starter Bonuses"
                value="$5,188"
                delay={0.55}
                isHighlight
              />
            </div>

            {/* Professional Exclusive Bonuses */}
            <div className="mt-6 pt-6 border-t border-orange-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400 font-bold text-sm tracking-widest uppercase">
                  PROFESSIONAL EXCLUSIVE BONUSES
                </span>
              </div>
              <ValueStackItem
                icon={Shield}
                label="Lifetime Platform Updates — Every New Feature & Improvement, Forever"
                value="$997"
                delay={0.6}
              />
              <ValueStackItem
                icon={Activity}
                label="Trainer Toolkit — 8 Pro Calculators (1RM, TDEE, Body Fat, BMI, BMR, HR Zones, Wilks, Recovery) — Delivered to Your Account"
                value="$297"
                delay={0.65}
              />
              <ValueStackItem
                icon={Star}
                label="Trainer Business Vault — Check-In Scripts, Social Templates, Acquisition Playbook — Delivered to Your Account"
                value="$497"
                delay={0.7}
              />
              <ValueStackItem
                icon={Dumbbell}
                label="ALL Specialty Program Drops as Released — Powerlifting, Sports Performance, Rehab, Competition Prep, Seniors, 12+/Year"
                value="$997"
                delay={0.75}
              />
              <ValueStackItem
                icon={TrendingUp}
                label="Advanced Client Acquisition Templates + Ad Copy Swipe File + Referral Playbook — Delivered to Your Account"
                value="$497"
                delay={0.8}
              />
            </div>

            {/* Total */}
            <AnimatedSection delay={0.85}>
              <div className="mt-8 pt-8 border-t border-white/20 text-center">
                <div className="text-white/50 text-lg mb-2">Total Value</div>
                <div className="text-4xl sm:text-5xl font-black text-white/30 line-through mb-4">
                  $11,976
                </div>
                <div className="text-sm text-white/50 mb-2">YOUR ONE-TIME PRICE</div>
                <div className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                  $299
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
                The Full Professional Toolkit
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                src: '/images/marketing/program-builder.png',
                alt: 'Program Builder — 8 program types, 7 set types, RPE/RIR/tempo',
                title: 'Program Builder',
                desc: '8 program types, 7 set types, RPE/RIR/tempo prescriptions, supersets, and deload weeks. Elite S&C programming for every client scenario.',
                icon: ClipboardList,
                color: 'from-blue-900/30 to-blue-800/10',
                iconColor: 'text-blue-400/30',
              },
              {
                src: '/images/marketing/analytics-overview.png',
                alt: 'Analytics — ACWR training load monitoring and progress charts',
                title: 'ACWR Analytics',
                desc: 'Acute:Chronic Workload Ratio monitoring used by professional sports teams — built in for free. Detect overtraining before it becomes injury.',
                icon: BarChart3,
                color: 'from-green-900/30 to-green-800/10',
                iconColor: 'text-green-400/30',
              },
              {
                src: '/images/marketing/schedule-calendar.png',
                alt: 'Schedule — 5 appointment types with iCal export',
                title: 'Scheduling & Calendar',
                desc: '5 appointment types, trainer availability, online session meeting links, and iCal export so clients sync directly to Google/Apple Calendar.',
                icon: Calendar,
                color: 'from-purple-900/30 to-purple-800/10',
                iconColor: 'text-purple-400/30',
              },
              {
                src: '/images/marketing/clients-list.png',
                alt: 'Client roster — unlimited clients with color tags and bulk operations',
                title: 'Client Management',
                desc: 'Unlimited clients with color-coded tags, bulk program assignment, tag-based filtering, and private trainer notes with Markdown support.',
                icon: Users,
                color: 'from-orange-900/30 to-orange-800/10',
                iconColor: 'text-orange-400/30',
              },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.1}>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                  <div
                    className={`aspect-video bg-gradient-to-br ${item.color} flex items-center justify-center relative overflow-hidden`}
                  >
                    <img
                      src={item.src}
                      alt={item.alt}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement
                        t.style.display = 'none'
                        t.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center">
                      <item.icon className={`w-16 h-16 ${item.iconColor}`} />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-white/60 text-sm">{item.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 5: UPGRADE FROM STARTER
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0a1020] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                Upgrading From Starter?
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4">
                Everything in Starter, PLUS...
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Users, text: 'Unlimited clients — no roster cap, ever' },
              {
                icon: ClipboardList,
                text: '8 program types + 7 set types including Drop Sets and AMRAP',
              },
              {
                icon: Activity,
                text: 'RPE, RIR, and tempo prescriptions per set — elite S&C language',
              },
              { icon: Zap, text: 'Superset and circuit support with A/B/C grouping' },
              { icon: Target, text: 'Deload week planning and reusable template library' },
              {
                icon: BarChart3,
                text: 'ACWR training load monitoring — used by NFL, NBA, and Olympic teams',
              },
              {
                icon: Calendar,
                text: '5 appointment types with Zoom/Meet links built in',
              },
              {
                icon: Download,
                text: 'iCal export and subscribable calendar — clients sync to Google/Apple Calendar',
              },
              {
                icon: BarChart3,
                text: 'Analytics reports in PDF and CSV — weekly, monthly, quarterly',
              },
              {
                icon: Tag,
                text: 'Unlimited tags with bulk program assignment in one click',
              },
              {
                icon: Activity,
                text: 'Trainer feedback on client sessions with review tools',
              },
              {
                icon: Users,
                text: 'Comparison baselines — "before and after" analytics for any date range',
              },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.03}>
                <div className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/20 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-white/80 text-sm leading-relaxed">{item.text}</span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 6: ROI CALCULATOR
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0d0d1a] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                ROI Calculator
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4">
                Your First Month Pays for{' '}
                <span className="text-green-400">Everything</span>
              </h2>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-blue-600/30 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-blue-400" />
                </div>
                <div className="text-3xl font-black text-white mb-2">10</div>
                <div className="text-white/60">Active Clients</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-blue-600/30 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-7 h-7 text-blue-400" />
                </div>
                <div className="text-3xl font-black text-white mb-2">
                  $100<span className="text-lg font-normal text-white/50">/mo each</span>
                </div>
                <div className="text-white/60">Per Client Revenue</div>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-green-600/30 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-green-400" />
                </div>
                <div className="text-3xl font-black text-green-400 mb-2">$1,000</div>
                <div className="text-white/60">Month 1 Revenue</div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <BadgeCheck className="w-6 h-6 text-green-400" />
                <span className="text-green-400 font-bold text-lg">
                  At 10 clients × $100/mo = $1,000/mo revenue. Your platform cost: $299 total.
                </span>
              </div>
            </div>

            <div className="mt-6 p-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-center">
              <p className="text-white/70 italic text-lg">
                &ldquo;Trainers on Professional typically recover their $299 in the first new client
                they land using EvoFit&apos;s professional analytics and reporting to justify their
                rates.&rdquo;
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 7: OBJECTION HANDLER
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0a1020] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-3">
                    &ldquo;I&apos;m not sure I need all the advanced programming features.&rdquo;
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    You need them before you think you do. When a client plateaus, you need set types
                    and RPE. When a client gets injured, you need the Rehabilitation program type.
                    When you want to run a 6-week challenge, you need bulk assignment. Buy
                    Professional once and have the tools before you need them — rather than upgrading
                    under pressure mid-client engagement.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 7B: ENTERPRISE UPSELL
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0a1030] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="bg-gradient-to-br from-orange-600/15 to-orange-800/10 border-2 border-orange-500/30 rounded-2xl p-8 sm:p-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-orange-500/30 flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <span className="text-orange-400 font-bold text-sm tracking-widest uppercase">
                    Running a Gym or Studio?
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                    For $100 More, Enterprise Gives You Total Control
                  </h2>
                </div>
              </div>

              <p className="text-white/60 text-base leading-relaxed mb-6">
                Professional is the complete coaching platform. Enterprise adds the admin layer — the tools platforms charge $500+/year for. You own it for $399, once.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {[
                  'Admin dashboard — platform-wide user, session, and growth stats',
                  'Full user management — search, filter, activate/deactivate, change roles',
                  'Feature flags API — enable features per user without code deploys',
                  'Security audit trail — IP, device, timestamp for every action',
                  'Bulk user operations — change roles or status for multiple users at once',
                  'System health monitoring — PostgreSQL, Redis, and API status in real time',
                  'Content moderation tools + support ticket management in-platform',
                  'Account lockout controls from admin panel — security without code changes',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-white/50 text-sm mb-4">
                  The $100 step from Professional to Enterprise is the best-value jump in the whole funnel.
                  Admin dashboards alone cost $500+/year on competing platforms.
                </p>
                <Link
                  href="/enterprise"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:scale-105"
                >
                  Get Enterprise Access — $399
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="mt-3 text-white/30 text-xs">Pay the $100 difference. Every Professional feature carries over.</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 8: FAQ
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0d0d1a] to-[#0A0A0F]" />
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
              question="How is Professional different from Starter?"
              answer="Starter is great for 1-5 clients and getting organized. Professional unlocks unlimited clients, the full program builder (8 program types, 7 set types, RPE/RIR/tempo), ACWR training load monitoring, 5 appointment types with scheduling, iCal export, analytics reports, and bulk operations. It's the complete platform."
            />
            <FAQItem
              question="What is ACWR and why does it matter?"
              answer="ACWR (Acute:Chronic Workload Ratio) is the same training load monitoring system used by the NFL, NBA, and Olympic sports teams. It compares your client's last 7 days of training load against their last 28 days to detect overtraining risk before it becomes injury. EvoFit calculates this automatically from workout data."
            />
            <FAQItem
              question="Can I really have unlimited clients for $299 forever?"
              answer="Yes. Professional has no client cap. You can have 5 clients or 500 — your $299 covers all of them. There are no per-client fees, no roster tiers, no surprise charges when you grow. Ever."
            />
            <FAQItem
              question="What does the template library let me do?"
              answer="Build a program once, save it as a template, and assign it to future clients in one click. Templates are categorized by program type, duration, and difficulty. Share them publicly with other EvoFit trainers or keep them private. The more programs you build, the more valuable your library becomes."
            />
            <FAQItem
              question="What if I eventually need Enterprise features?"
              answer="Upgrade at any time. Pay the difference between Professional ($299) and Enterprise ($399) — just $100. Your data, clients, programs, and settings migrate seamlessly. You never rebuild from scratch."
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 9: GUARANTEE
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0a1020] to-[#0A0A0F]" />
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
                Try EvoFit Professional for 14 days. If you don&apos;t love it — if it
                doesn&apos;t make your coaching business run smoother and look more professional —
                email us for a full refund. No questions. No hassle. No risk.
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
          SECTION 10: FINAL CTA
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0a1020] to-[#0A0A0F]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/15 rounded-full blur-[130px]" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-sm font-bold mb-8">
              <Crown className="w-4 h-4" />
              MOST POPULAR PLAN
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Ready to Run a{' '}
              <span className="text-blue-400">Professional Coaching Business</span>?
            </h2>
            <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto">
              $299. One time. Unlimited clients. Break even in month 3.
            </p>

            <Link
              href="/register"
              className="inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xl rounded-xl shadow-[0_0_40px_rgba(249,115,22,0.3)] hover:shadow-[0_0_60px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:scale-105"
            >
              Upgrade to Professional — $299
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
                <Users className="w-4 h-4" />
                Unlimited clients
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
