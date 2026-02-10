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
} from 'lucide-react'

const features = [
  {
    icon: Dumbbell,
    title: 'Exercise Library',
    description:
      'Access 1,300+ exercises with detailed instructions, muscle targeting, and equipment filters. Build your custom collection.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: ClipboardList,
    title: 'Program Builder',
    description:
      'Design multi-week training programs with periodization, progressive overload, and drag-and-drop workout scheduling.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Users,
    title: 'Client Management',
    description:
      'Manage your roster of clients with profiles, status tracking, program assignments, and communication tools.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Activity,
    title: 'Workout Tracking',
    description:
      'Real-time workout logging with set tracking, RPE scoring, rest timers, and automatic volume calculations.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description:
      'Track personal bests, training load, body measurements, and goal progress with visual dashboards and trend analysis.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: Zap,
    title: 'Activity Feed',
    description:
      'Stay connected with a real-time feed of workouts completed, milestones achieved, and program updates across your team.',
    color: 'bg-yellow-50 text-yellow-600',
  },
]

const benefits = [
  'Manage unlimited clients from one dashboard',
  'Build and assign programs in minutes',
  'Track every rep, set, and personal record',
  'Monitor client progress with analytics',
  'Works on desktop, tablet, and mobile',
  'Secure JWT authentication and role-based access',
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
              Transform Your{' '}
              <span className="text-blue-200">Fitness Business</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10"
            >
              The all-in-one platform for personal trainers. Build programs,
              track workouts, manage clients, and grow your business with
              powerful analytics.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold border-2 border-white/30 text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                Sign In
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
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
      <section className="bg-gray-50 py-20 md:py-28">
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
              From exercise libraries to advanced analytics, EvoFit gives you
              the tools to deliver exceptional training experiences.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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

      {/* Benefits Section */}
      <section className="bg-white py-20 md:py-28">
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
                Built for Trainers, By Trainers
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg text-gray-600 mb-8"
              >
                Whether you train one client or a hundred, EvoFit scales with
                your business. Stop juggling spreadsheets and start delivering
                results.
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
                        Active Clients
                      </p>
                      <p className="text-3xl font-bold text-gray-900">24</p>
                      <p className="text-xs text-green-600 mt-1">
                        +3 this month
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">
                        Workouts This Week
                      </p>
                      <p className="text-3xl font-bold text-gray-900">47</p>
                      <p className="text-xs text-green-600 mt-1">
                        92% completion
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">
                        Programs Active
                      </p>
                      <p className="text-3xl font-bold text-gray-900">12</p>
                      <p className="text-xs text-blue-600 mt-1">
                        4 templates
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">
                        Exercises
                      </p>
                      <p className="text-3xl font-bold text-gray-900">1,300+</p>
                      <p className="text-xs text-purple-600 mt-1">
                        Full library
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="bg-gray-50 py-20 md:py-28">
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
              Tailored dashboards and tools for every role in your training
              business.
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
              Ready to Elevate Your Training?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto"
            >
              Join trainers who are already using EvoFit to deliver better
              results, save time, and grow their business.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
              >
                Create Your Account
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
                their clients. Build programs, track workouts, and grow your
                business.
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
                    Sign Up
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
