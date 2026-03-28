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
  Settings,
  Flag,
  FileSearch,
  Building2,
  TrendingUp,
  Lock,
  UserCog,
  HeartPulse,
  Tag,
  ClipboardList,
  Calendar,
  Download,
  AlertCircle,
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

export default function EnterpriseSalesPage() {
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
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-orange-500/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm font-bold mb-8"
          >
            <Building2 className="w-4 h-4" />
            ENTERPRISE — FOR GYM OWNERS &amp; TEAMS
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 tracking-tight"
          >
            Platform-Level Control for{' '}
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-orange-400 bg-clip-text text-transparent">
              Gym Owners &amp; Studio Operators.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Admin dashboard, feature flags, audit logs, and multi-trainer oversight — everything
            you need to{' '}
            <span className="text-white font-semibold">manage a team and a platform</span>, not
            just your own clients.
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
              Get Enterprise Access — $399
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-white/40 text-sm">
              One-time payment. Full admin access. No per-trainer fees. Ever.
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
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Full admin dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-orange-400" />
              <span>All Professional features included</span>
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
          SECTION 2: EPIPHANY BRIDGE — THE GYM OWNER PROBLEM
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0d0d1a] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                The Problem No One Talks About
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4 leading-tight">
                You Run a Gym.{' '}
                <span className="text-blue-400">But You Can&apos;t See What&apos;s Happening Inside It.</span>
              </h2>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="space-y-6 text-white/70 leading-relaxed text-lg">
              <p>
                You have three trainers. Each one is coaching clients, building programs, and
                logging sessions. But you have{' '}
                <span className="text-white font-semibold">
                  no visibility into what any of them are doing
                </span>
                .
              </p>
              <p>
                Who logged in today? Which clients are at risk of churning? Which trainer is
                overloading their athletes? Which feature should you roll out to premium clients
                first?
              </p>
              <p className="text-white/50 italic border-l-2 border-blue-500/50 pl-6">
                &ldquo;I had no idea one of my trainers hadn&apos;t logged into the platform in
                two weeks. I found out when a client complained.&rdquo;
              </p>
              <p>
                Enterprise solves this. You get the{' '}
                <span className="text-blue-400 font-semibold">
                  admin dashboard, activity audit log, feature flags, and bulk user management
                </span>{' '}
                to run EvoFit as your studio&apos;s operating system — not just as a tool for one
                trainer.
              </p>
              <p className="text-xl text-white font-semibold">
                One platform. Every trainer. Full visibility. $399, once.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 3: ADMIN FEATURES SHOWCASE
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0a1020] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                Enterprise-Only Features
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4">
                The Admin Layer No Competitor Offers
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <AnimatedSection delay={0.1}>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-blue-900/30 to-blue-800/10 flex items-center justify-center relative overflow-hidden">
                  <img
                    src="/images/marketing/trainer-dashboard.png"
                    alt="Admin Dashboard — platform-wide statistics and user management"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement
                      t.style.display = 'none'
                      t.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center">
                    <BarChart3 className="w-16 h-16 text-blue-400/30" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2">Admin Dashboard</h3>
                  <p className="text-white/60 text-sm">
                    Platform-wide statistics: total users, active sessions, growth trends, system
                    health. Everything you need to know at a glance.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-orange-900/30 to-orange-800/10 flex items-center justify-center relative overflow-hidden">
                  <img
                    src="/images/marketing/clients-list.png"
                    alt="User Management — search, filter, activate, deactivate, change roles"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement
                      t.style.display = 'none'
                      t.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center">
                    <Users className="w-16 h-16 text-orange-400/30" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2">User Management</h3>
                  <p className="text-white/60 text-sm">
                    Search, filter, sort every user. Activate, deactivate, change roles. Bulk
                    operations on multiple users simultaneously.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Admin feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: FileSearch,
                title: 'Activity Log',
                desc: 'Platform-wide audit trail with IP, device, and timestamp for every login and role change.',
              },
              {
                icon: Flag,
                title: 'Feature Flags',
                desc: 'Enable or disable features for specific users or groups — without deploying code.',
              },
              {
                icon: HeartPulse,
                title: 'System Health',
                desc: 'Real-time PostgreSQL, Redis, and API status monitoring. Know before clients do.',
              },
              {
                icon: UserCog,
                title: 'Bulk Operations',
                desc: 'Activate, deactivate, or change roles for multiple users in a single action.',
              },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.05 + 0.3}>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-all duration-300 h-full group">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors">
                    <item.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed text-sm">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 4: VALUE STACK
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0d0d1a] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                The Value Stack
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4">
                Everything in Enterprise
              </h2>
              <p className="text-white/50 mt-4 text-lg">
                Admin features + every Professional feature — one price
              </p>
            </div>
          </AnimatedSection>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            {/* Admin-only features */}
            <div className="mb-4 pb-2 border-b border-blue-500/30">
              <span className="text-blue-400 font-bold text-xs tracking-widest uppercase">
                ENTERPRISE-ONLY ADMIN FEATURES
              </span>
            </div>
            <ValueStackItem
              icon={BarChart3}
              label="Admin Dashboard — Platform-Wide Statistics & Growth Trends"
              value="$800/yr"
              delay={0}
            />
            <ValueStackItem
              icon={Users}
              label="Full User Management — Search, Filter, Activate, Deactivate, Role Change"
              value="$600/yr"
              delay={0.05}
            />
            <ValueStackItem
              icon={Flag}
              label="Feature Flags API — Enable/Disable Features Per User Without Deployment"
              value="$500/yr"
              delay={0.1}
            />
            <ValueStackItem
              icon={FileSearch}
              label="Activity Log & Security Audit Trail — IP, Device, Timestamp Per Event"
              value="$400/yr"
              delay={0.15}
            />
            <ValueStackItem
              icon={UserCog}
              label="Bulk User Operations — Activate, Deactivate, Role Change at Scale"
              value="$300/yr"
              delay={0.2}
            />
            <ValueStackItem
              icon={HeartPulse}
              label="System Health Monitoring — PostgreSQL, Redis, API Status Real-Time"
              value="$300/yr"
              delay={0.25}
            />
            <ValueStackItem
              icon={AlertCircle}
              label="Support Ticket Management — Track & Resolve User Issues In-Platform"
              value="$200/yr"
              delay={0.3}
            />
            <ValueStackItem
              icon={Lock}
              label="Content Moderation Tools — Flag & Manage Reported Content"
              value="$200/yr"
              delay={0.35}
            />
            <ValueStackItem
              icon={UserCog}
              label="Role Assignment at Scale — Promote Trainers, Manage Org Structure"
              value="$200/yr"
              delay={0.4}
            />

            {/* Everything in Professional */}
            <div className="mt-6 pt-6 border-t border-orange-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400 font-bold text-sm tracking-widest uppercase">
                  PLUS ALL PROFESSIONAL FEATURES
                </span>
              </div>
              <ValueStackItem
                icon={Users}
                label="Unlimited Clients + Full Program Builder + ACWR Analytics + Scheduling"
                value="$8,500/yr"
                delay={0.45}
                isHighlight
              />
            </div>

            {/* Total */}
            <AnimatedSection delay={0.5}>
              <div className="mt-8 pt-8 border-t border-white/20 text-center">
                <div className="text-white/50 text-lg mb-2">Total Annual Value</div>
                <div className="text-4xl sm:text-5xl font-black text-white/30 line-through mb-4">
                  $12,000/yr
                </div>
                <div className="text-sm text-white/50 mb-2">YOUR ONE-TIME PRICE</div>
                <div className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                  $399
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
          SECTION 5: TEAM USE CASE
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0a1020] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                Multiple Trainers Under One Roof
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4">
                Run Your Entire Gym on EvoFit
              </h2>
              <p className="text-white/60 mt-4 text-lg max-w-2xl mx-auto">
                Enterprise is the only tier that lets you manage a team of trainers with
                administrative oversight, feature control, and a full audit trail.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Building2,
                title: 'Gym Owners',
                desc: 'Manage all your trainers and clients from one admin panel. See platform-wide activity. Control which features each trainer or client group can access.',
                examples: ['3-10 trainers on one platform', 'Admin oversight of all sessions', 'Feature flags for premium tiers'],
              },
              {
                icon: Users,
                title: 'Studio Operators',
                desc: 'Run a boutique fitness studio with group class scheduling, multiple trainer accounts, and the activity log to track engagement across your entire membership.',
                examples: ['Group class management', 'Multi-trainer roster', 'Membership activity log'],
              },
              {
                icon: TrendingUp,
                title: 'Lead Trainers',
                desc: 'Run a franchise or mentorship program. Manage junior trainers under your brand, monitor their platform activity, and control feature rollouts.',
                examples: ['Franchise management', 'Trainer accountability', 'Role-based access control'],
              },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.1}>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-blue-500/30 transition-all duration-300 h-full">
                  <div className="w-14 h-14 rounded-xl bg-blue-600/20 flex items-center justify-center mb-6">
                    <item.icon className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed text-sm mb-4">{item.desc}</p>
                  <ul className="space-y-2">
                    {item.examples.map((ex) => (
                      <li key={ex} className="flex items-center gap-2 text-white/50 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={0.4}>
            <div className="mt-8 p-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-center">
              <p className="text-white/70 italic text-lg">
                &ldquo;Studio owners on Enterprise tell us that the activity log alone is worth the
                upgrade — finally knowing exactly who&apos;s using what features and when, without
                asking anyone.&rdquo;
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 6: EVERYTHING IN PROFESSIONAL + MORE
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0d0d1a] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                Full Feature Set
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-4">
                Everything in Professional, PLUS Admin
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: BarChart3, text: 'Admin dashboard with platform-wide statistics and growth trends' },
              { icon: Users, text: 'Full user management — search, filter, activate/deactivate across all users' },
              { icon: Flag, text: 'Feature flags API — roll out capabilities to specific users without code changes' },
              { icon: FileSearch, text: 'Activity log and security audit trail — every login, role change, and event' },
              { icon: UserCog, text: 'Bulk user operations — change roles or status for multiple users at once' },
              { icon: HeartPulse, text: 'System health monitoring — PostgreSQL, Redis, and API status in real time' },
              { icon: AlertCircle, text: 'Support ticket management — track and resolve user issues in-platform' },
              { icon: Lock, text: 'Content moderation and account lockout management from admin panel' },
              { icon: ClipboardList, text: 'Unlimited clients + full program builder (8 types, 7 set types, RPE/RIR/tempo)' },
              { icon: BarChart3, text: 'ACWR training load monitoring + analytics reports in PDF and CSV' },
              { icon: Calendar, text: '5 appointment types + iCal export + subscribable calendar feed' },
              { icon: Tag, text: 'Unlimited color tags + bulk program assignment for entire tag groups' },
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
          SECTION 7: OBJECTION HANDLER
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0a1020] to-[#0A0A0F]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase">
                Objection Handler
              </span>
              <h2 className="text-3xl sm:text-4xl font-black mt-4">
                &ldquo;I&apos;m just one trainer. Do I need Enterprise?&rdquo;
              </h2>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-white/70 leading-relaxed text-lg">
                    Probably not today. Enterprise is designed for operators managing multiple
                    trainers or users who need administrative visibility. If you&apos;re flying solo
                    with clients,{' '}
                    <Link href="/professional" className="text-blue-400 underline hover:text-blue-300">
                      Professional
                    </Link>{' '}
                    is the right fit and you can always upgrade to Enterprise later as your business
                    grows.
                  </p>
                  <p className="text-white/70 leading-relaxed text-lg mt-4">
                    The upgrade path is pay the difference: Professional ($299) → Enterprise ($399)
                    = $100 to upgrade. Your data, clients, and programs stay intact.
                  </p>
                </div>
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
              question="How many trainers can I have on Enterprise?"
              answer="There is no trainer cap in Enterprise. You can add as many trainer accounts as your gym or studio requires. Each trainer gets their own clients, programs, and scheduling — and you get admin visibility over all of them from the admin dashboard."
            />
            <FAQItem
              question="What are feature flags and why do I care?"
              answer="Feature flags let you enable or disable specific features for specific users or groups — without any code changes or deployments. For example, you can enable the AI add-on for premium members only, or roll out a new feature to a pilot group before enabling it for everyone. It's granular control over your platform's feature set."
            />
            <FAQItem
              question="What's in the activity log?"
              answer="The activity log is a platform-wide audit trail showing every login attempt (including failed ones), role changes, feature flag updates, and system events. Each entry includes IP address, user agent, device info, and timestamp. It's the same level of audit logging used by enterprise SaaS platforms."
            />
            <FAQItem
              question="Can I manage multiple gym locations under one Enterprise account?"
              answer="Yes. Enterprise gives you admin visibility across all users regardless of location. Use custom tags to segment users by location, and use the role system to assign location-specific trainers and admins. Your entire operation in one dashboard."
            />
            <FAQItem
              question="Is there a per-trainer fee for Enterprise?"
              answer="No. Enterprise is one flat fee — $399 once. You can add as many trainers and clients as your studio needs. No per-trainer costs, no per-client charges, no annual renewal. The platform scales with your business at no additional software cost."
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
                Try EvoFit Enterprise for 14 days. If it doesn&apos;t give you the admin visibility
                and team management tools you need to run your studio — email us for a full refund.
                No questions. No hassle. No risk.
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm font-bold mb-8">
              <Building2 className="w-4 h-4" />
              FOR GYM OWNERS &amp; STUDIO OPERATORS
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Ready to Run Your Gym on{' '}
              <span className="text-blue-400">One Platform</span>?
            </h2>
            <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto">
              $399. One time. Full admin access. Every trainer. Every client.
            </p>

            <Link
              href="/register"
              className="inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xl rounded-xl shadow-[0_0_40px_rgba(249,115,22,0.3)] hover:shadow-[0_0_60px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:scale-105"
            >
              Get Enterprise Access — $399
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
                <Building2 className="w-4 h-4" />
                No per-trainer fees
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
