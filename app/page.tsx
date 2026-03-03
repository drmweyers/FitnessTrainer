'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Dumbbell,
  ClipboardList,
  Users,
  Activity,
  BarChart3,
  Zap,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Sparkles,
  DollarSign,
  Infinity,
  Shield,
} from 'lucide-react'

const features = [
  {
    icon: Dumbbell,
    title: 'Exercise Library',
    description:
      'Access 1,344 professional exercises with animated GIF demonstrations, advanced filters, and custom collections. Build your toolkit from day one.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: ClipboardList,
    title: 'Program Builder',
    description:
      'Design multi-week programs with RPE, tempo prescriptions, 7 set types, and superset support. Elite S&C-level programming for any client.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Users,
    title: 'Client Management',
    description:
      'Manage your roster with 5 status states, color-coded tags, private notes, and professional email invitations. CRM-level organization.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Activity,
    title: 'Workout Tracking',
    description:
      'Real-time logging with automatic PR detection, adherence scoring, rest timers, and offline support. Every rep, set, and personal record captured.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description:
      'ACWR training load monitoring, 8 metric types, AI-powered insights, and downloadable reports. Pro-level analytics for every trainer.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: Zap,
    title: 'Activity Feed',
    description:
      'Real-time feed of workouts completed, milestones achieved, and program updates. Stay connected with your clients between sessions.',
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    icon: Calendar,
    title: 'Scheduling & Calendar',
    description:
      '5 appointment types, configurable availability, and online session support. Manage 1:1 training, group classes, and consultations in one calendar.',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    icon: Sparkles,
    title: 'AI Workout Builder',
    description:
      'Auto-generate workouts from the full 1,344 exercise library. Filter by equipment, body part, and difficulty for instant programming.',
    color: 'bg-cyan-50 text-cyan-600',
  },
]

const benefits = [
  'Pay once, own forever — no monthly fees',
  '1,344 exercises with animated demonstrations',
  'Build and assign programs in minutes',
  'ACWR training load monitoring (pro-level analytics)',
  'Track every rep, set, and personal record',
  'Works on desktop, tablet, and mobile',
]

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function HomePage() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-36">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <img
                src="/logo.svg"
                alt="EvoFit Trainer"
                width={72}
                height={72}
                className="mx-auto rounded-xl shadow-lg"
              />
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6"
            >
              Own Your Coaching Platform.{' '}
              <span className="text-blue-200">Forever.</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-6"
            >
              The all-in-one fitness coaching platform. Pay once, use forever. No monthly fees. No per-client charges. Just powerful tools that are yours for life.
            </motion.p>

            <motion.p
              variants={fadeInUp}
              className="text-base md:text-lg text-blue-200 max-w-2xl mx-auto mb-10"
            >
              While others charge $50-200/month, EvoFit is yours with a single payment.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Lifetime Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button
                onClick={scrollToFeatures}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold border-2 border-white/30 text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                See Features
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 46.7C840 53.3 960 66.7 1080 66.7C1200 66.7 1320 53.3 1380 46.7L1440 40V80H0Z"
              fill="#F9FAFB"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Everything You Need to Train Smarter
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              From 1,344 exercise demonstrations to ACWR analytics, EvoFit gives you pro-level tools without the pro-level subscription.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
              >
                <div
                  className={`inline-flex p-3 rounded-xl ${feature.color} mb-5 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature Spotlight Section */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Feature Spotlight
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              A closer look at the tools that make EvoFit the most comprehensive coaching platform in its class.
            </motion.p>
          </motion.div>

          <div className="space-y-20">
            {/* Exercise Library Spotlight */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div>
                <motion.h3
                  variants={fadeInUp}
                  className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
                >
                  1,344 Exercises. Zero Setup.
                </motion.h3>
                <motion.p
                  variants={fadeInUp}
                  className="text-lg text-gray-600 mb-6"
                >
                  The Exercise Library is your complete movement database from day one. Every exercise includes an animated GIF demonstration, step-by-step instructions, target and secondary muscle mapping, and difficulty classification. Unlike competitors that force you to upload your own content, EvoFit ships ready to use.
                </motion.p>
                <motion.ul variants={staggerContainer} className="space-y-3">
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">1,344 exercises with animated GIF demonstrations</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">10 body parts, 29 equipment types, 26 target muscles</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Advanced multi-filter search (body + equipment + muscle + difficulty)</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Custom collections and favorites for one-click access</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Mobile-optimized for in-gym demonstrations</span>
                  </motion.li>
                </motion.ul>
              </div>
              <motion.div
                variants={fadeInUp}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 flex items-center justify-center"
              >
                {/* Screenshot reference: screenshots/trainer/exercises-library-desktop.png */}
                <div className="text-center">
                  <Dumbbell className="h-32 w-32 text-blue-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">Exercise Library Interface</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Program Builder Spotlight */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <motion.div
                variants={fadeInUp}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 flex items-center justify-center lg:order-1"
              >
                {/* Screenshot reference: screenshots/trainer/program-create-desktop.png */}
                <div className="text-center">
                  <ClipboardList className="h-32 w-32 text-green-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">Program Builder Interface</p>
                </div>
              </motion.div>
              <div className="lg:order-2">
                <motion.h3
                  variants={fadeInUp}
                  className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
                >
                  Elite Programming. Simple Interface.
                </motion.h3>
                <motion.p
                  variants={fadeInUp}
                  className="text-lg text-gray-600 mb-6"
                >
                  The Program Builder gives you the same sophisticated programming tools used in elite strength and conditioning facilities. Design multi-week periodized programs with RPE tracking, tempo prescriptions, and 7 set types. Build once, save as a template, and assign to unlimited clients.
                </motion.p>
                <motion.ul variants={staggerContainer} className="space-y-3">
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">8 program types: strength, hypertrophy, powerlifting, rehab, and more</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">7 set types including AMRAP, drop sets, pyramids, cluster sets</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">RPE/RIR tracking and tempo prescriptions (e.g., "3-1-2-0")</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Superset and circuit grouping with drag-and-drop ordering</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Save unlimited templates and bulk assign to groups</span>
                  </motion.li>
                </motion.ul>
              </div>
            </motion.div>

            {/* Analytics Spotlight */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div>
                <motion.h3
                  variants={fadeInUp}
                  className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
                >
                  Pro Sports Analytics for Every Trainer
                </motion.h3>
                <motion.p
                  variants={fadeInUp}
                  className="text-lg text-gray-600 mb-6"
                >
                  EvoFit's analytics suite includes ACWR (Acute:Chronic Workload Ratio) monitoring — the same metric used by professional sports teams to prevent overtraining. Track 8 performance metrics, generate AI-powered insights prioritized by impact, and give clients visual proof of their progress with body composition charts and goal tracking.
                </motion.p>
                <motion.ul variants={staggerContainer} className="space-y-3">
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">ACWR training load monitoring (7-day acute vs 28-day chronic)</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">8 metric types: 1RM, volume, power, endurance, body composition</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">AI-powered insights with priority levels and action tracking</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Goal tracking with visual progress and target date countdowns</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Downloadable analytics reports for client reviews</span>
                  </motion.li>
                </motion.ul>
              </div>
              <motion.div
                variants={fadeInUp}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 flex items-center justify-center"
              >
                {/* Screenshot reference: screenshots/trainer/analytics-desktop.png */}
                <div className="text-center">
                  <BarChart3 className="h-32 w-32 text-indigo-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">Analytics Dashboard</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Client Management Spotlight */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <motion.div
                variants={fadeInUp}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 flex items-center justify-center lg:order-1"
              >
                {/* Screenshot reference: screenshots/trainer/clients-list-desktop.png */}
                <div className="text-center">
                  <Users className="h-32 w-32 text-purple-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">Client Management</p>
                </div>
              </motion.div>
              <div className="lg:order-2">
                <motion.h3
                  variants={fadeInUp}
                  className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
                >
                  CRM-Level Client Organization
                </motion.h3>
                <motion.p
                  variants={fadeInUp}
                  className="text-lg text-gray-600 mb-6"
                >
                  Your client roster is more than a list — it's your business operations center. Track clients through 5 status states, organize with color-coded tags, send professional email invitations, and maintain private session notes that clients never see. Scale from one client to hundreds without losing the personal touch.
                </motion.p>
                <motion.ul variants={staggerContainer} className="space-y-3">
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">5 status states: Active, Pending, Offline, Need Programming, Archived</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Professional email invitations with custom welcome messages</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Color-coded tags for organizing by schedule, goal, or level</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Private notes system for session observations and coaching cues</span>
                  </motion.li>
                  <motion.li variants={fadeInUp} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Medical history and injury tracking for safe programming</span>
                  </motion.li>
                </motion.ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-6"
              >
                Built for Trainers Who Refuse to Rent
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg text-gray-600 mb-8"
              >
                Whether you train one client or a hundred, EvoFit scales with your business. Stop paying monthly subscriptions and own your coaching platform outright.
              </motion.p>
              <motion.ul variants={staggerContainer} className="space-y-4">
                {benefits.map((benefit) => (
                  <motion.li
                    key={benefit}
                    variants={fadeInUp}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 lg:p-12">
                <div className="space-y-6">
                  {/* Stats preview */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">
                        Exercises
                      </p>
                      <p className="text-3xl font-bold text-gray-900">1,344</p>
                      <p className="text-xs text-purple-600 mt-1">
                        All included
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">
                        Program Types
                      </p>
                      <p className="text-3xl font-bold text-gray-900">8</p>
                      <p className="text-xs text-green-600 mt-1">
                        Full flexibility
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">
                        Set Types
                      </p>
                      <p className="text-3xl font-bold text-gray-900">7</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Elite programming
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">
                        Target Muscles
                      </p>
                      <p className="text-3xl font-bold text-gray-900">26</p>
                      <p className="text-xs text-orange-600 mt-1">
                        Complete mapping
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-6"
            >
              Professional-Grade Tools You Own Outright
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-600 max-w-3xl mx-auto mb-12"
            >
              Trusted by trainers who refuse to rent their business software. Pay once, use forever, and keep every dollar you earn without monthly fees eating into your profits.
            </motion.p>
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              <motion.div variants={fadeInUp} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">1,344</div>
                <div className="text-sm text-gray-600">Exercises Included</div>
              </motion.div>
              <motion.div variants={fadeInUp} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">8</div>
                <div className="text-sm text-gray-600">Program Types</div>
              </motion.div>
              <motion.div variants={fadeInUp} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">7</div>
                <div className="text-sm text-gray-600">Set Types</div>
              </motion.div>
              <motion.div variants={fadeInUp} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">26</div>
                <div className="text-sm text-gray-600">Target Muscles</div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Stop Renting. Start Owning.
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              While competitors charge you every month forever, EvoFit gives you lifetime access with one payment.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="max-w-lg mx-auto"
          >
            <div className="bg-white rounded-3xl shadow-xl border-2 border-blue-200 p-8 md:p-12 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-semibold shadow-lg">
                Launch Special
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Lifetime License</h3>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-gray-400 line-through text-xl">$99/mo</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-gray-900">$299</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">one-time payment</p>
              </div>

              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-center gap-2 text-green-800 font-semibold">
                  <DollarSign className="h-5 w-5" />
                  <span>Save $3,267 over 3 years</span>
                </div>
                <p className="text-sm text-green-700 text-center mt-2">
                  That's less than 2 months of what competitors charge
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">All 1,344 exercises with GIF demonstrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited programs and clients</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">ACWR analytics and AI insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Scheduling and calendar management</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Offline workout tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <Infinity className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-semibold">Lifetime updates and support</span>
                </li>
              </ul>

              <Link
                href="/auth/register"
                className="block w-full text-center px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Get Lifetime Access — $299
              </Link>

              <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>30-day money-back guarantee</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              One Platform, Three Perspectives
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              Tailored dashboards and tools for every role in your training business.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-2xl p-8 border-2 border-red-100 shadow-sm"
            >
              <div className="inline-flex px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-4">
                Administrator
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Full Control
              </h3>
              <p className="text-gray-600 mb-4">
                Oversee all trainers and clients, manage exercises, view
                platform-wide analytics, and configure system settings.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-500" />
                  Platform analytics dashboard
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-500" />
                  User and role management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-500" />
                  Exercise library curation
                </li>
              </ul>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-2xl p-8 border-2 border-blue-200 shadow-md relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                Most Popular
              </div>
              <div className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                Trainer
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Build and Coach
              </h3>
              <p className="text-gray-600 mb-4">
                Create programs, assign to clients, track their progress, and
                communicate -- all from your personalized dashboard.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Client roster management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Program builder with templates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Workout tracking and analytics
                </li>
              </ul>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-2xl p-8 border-2 border-green-100 shadow-sm"
            >
              <div className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
                Client
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Train and Improve
              </h3>
              <p className="text-gray-600 mb-4">
                Follow assigned programs, log workouts in real time, track your
                personal records, and see your progress over time.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Real-time workout logging
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Progress tracking and goals
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Personal bests and milestones
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-6"
            >
              Stop Renting. Start Owning.
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto"
            >
              While competitors charge you every month, EvoFit gives you lifetime access. One payment. All features. Forever yours.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
              >
                Get Lifetime Access — $299
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold border-2 border-white/30 text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                Sign In to Dashboard
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logo.svg"
                  alt="EvoFit Trainer"
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
                <span className="text-white text-lg font-semibold">
                  EvoFit Trainer
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-md">
                The professional fitness platform for personal trainers and
                their clients. Pay once, own forever. No monthly fees.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/exercises"
                    className="hover:text-white transition-colors"
                  >
                    Exercise Library
                  </Link>
                </li>
                <li>
                  <Link
                    href="/programs"
                    className="hover:text-white transition-colors"
                  >
                    Programs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/workouts"
                    className="hover:text-white transition-colors"
                  >
                    Workouts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/analytics"
                    className="hover:text-white transition-colors"
                  >
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/auth/register"
                    className="hover:text-white transition-colors"
                  >
                    Get Lifetime Access
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/login"
                    className="hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-10 pt-8 text-center text-sm">
            <p>
              &copy; {new Date().getFullYear()} EvoFit Trainer. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
