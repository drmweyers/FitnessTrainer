'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Clock,
  TrendingUp,
  Activity,
  Star,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react'

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

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch('https://smartsocial-ai.com/api/email-crm/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          productTag: 'evofit-trainer',
          source: 'trainer.evofit.io'
        })
      })
      
      if (response.ok) {
        setSubmitMessage('Success! Check your email for instant access.')
        setEmail('')
        setFirstName('')
      } else {
        setSubmitMessage('Something went wrong. Please try again.')
      }
    } catch (err) {
      setSubmitMessage('Something went wrong. Please try again.')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">EvoFit Trainer</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">
                Reviews
              </Link>
              <Link 
                href="/pricing"
                className="inline-flex items-center px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all hover:scale-105"
              >
                Get Lifetime Access
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link href="#features" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                  Features
                </Link>
                <Link href="#pricing" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                  Pricing
                </Link>
                <Link href="#testimonials" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                  Reviews
                </Link>
                <Link href="/pricing" className="block px-3 py-2 bg-green-600 text-white rounded-lg text-center font-semibold">
                  Get Lifetime Access
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-trainer.png"
            alt="Personal trainer working with client in modern gym"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gray-900/70"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              Scale Your Training Business{' '}
              <span className="text-green-400">Without Burnout</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed"
            >
              Stop writing workout programs from scratch. EvoFit Trainer gives you everything you need to train more clients in less time — from exercise library to AI-generated programs.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all hover:scale-105 shadow-lg"
              >
                Get Lifetime Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold border-2 border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                See How It Works
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="bg-gray-900 text-white py-20">
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
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              Still Programming Workouts Manually?
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={fadeInUp} className="bg-white/5 rounded-xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600/20 rounded-xl mb-6">
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
              <div className="text-3xl font-bold text-orange-400 mb-2">3-5 hours</div>
              <h3 className="text-xl font-semibold mb-4">per client</h3>
              <p className="text-gray-300 leading-relaxed">
                Writing custom programs from scratch eats your entire weekend. Time you should be growing your business or with family.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-white/5 rounded-xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600/20 rounded-xl mb-6">
                <TrendingUp className="h-8 w-8 text-red-400" />
              </div>
              <div className="text-3xl font-bold text-red-400 mb-2">Stuck at 15</div>
              <h3 className="text-xl font-semibold mb-4">clients</h3>
              <p className="text-gray-300 leading-relaxed">
                Can't take on new clients because each one requires hours of manual programming. Your income hits a ceiling.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-white/5 rounded-xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-xl mb-6">
                <Activity className="h-8 w-8 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-purple-400 mb-2">67%</div>
              <h3 className="text-xl font-semibold mb-4">trainer burnout</h3>
              <p className="text-gray-300 leading-relaxed">
                Rushing through programs to save time means lower quality. Clients notice. Your reputation suffers.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-6"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              EvoFit Trainer: The Complete Platform for Professional Fitness Programming
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-600 leading-relaxed"
            >
              Built specifically for trainers who refuse to choose between quality and scale. Create professional workout programs in minutes, not hours. Manage unlimited clients with tools that actually work. Focus on coaching — let us handle the admin.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
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
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              Everything You Need in One Platform
            </motion.h2>
          </motion.div>

          {/* Feature 1: Program Builder */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20"
          >
            <div>
              <motion.h3
                variants={fadeInUp}
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
              >
                Build Programs in Minutes, Not Hours
              </motion.h3>
              <motion.ul variants={staggerContainer} className="space-y-4">
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Drag-and-drop program creation saves 3+ hours per client</span>
                </motion.li>
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">500+ pre-loaded exercises with video demonstrations</span>
                </motion.li>
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Template library for instant program variations</span>
                </motion.li>
              </motion.ul>
            </div>
            <motion.div variants={fadeInUp} className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/feature-program.png"
                alt="Program builder interface showing drag-and-drop workout creation"
                width={600}
                height={400}
                className="w-full h-auto"
                loading="lazy"
              />
            </motion.div>
          </motion.div>

          {/* Feature 2: Exercise Library */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20"
          >
            <motion.div variants={fadeInUp} className="rounded-xl overflow-hidden shadow-lg lg:order-1">
              <Image
                src="/images/feature-exercise.png"
                alt="Exercise library with search filters and video demonstrations"
                width={600}
                height={400}
                className="w-full h-auto"
                loading="lazy"
              />
            </motion.div>
            <div className="lg:order-2">
              <motion.h3
                variants={fadeInUp}
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
              >
                Professional Exercise Database at Your Fingertips
              </motion.h3>
              <motion.ul variants={staggerContainer} className="space-y-4">
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Search by muscle group, equipment, or movement pattern</span>
                </motion.li>
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">High-quality video demonstrations for every exercise</span>
                </motion.li>
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Custom exercise uploads to build your unique library</span>
                </motion.li>
              </motion.ul>
            </div>
          </motion.div>

          {/* Feature 3: Client Management */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20"
          >
            <div>
              <motion.h3
                variants={fadeInUp}
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
              >
                Track Every Client's Progress Effortlessly
              </motion.h3>
              <motion.ul variants={staggerContainer} className="space-y-4">
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Assign programs and track completion rates automatically</span>
                </motion.li>
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Progress photos and measurements in one dashboard</span>
                </motion.li>
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Automated reminders keep clients engaged between sessions</span>
                </motion.li>
              </motion.ul>
            </div>
            <motion.div variants={fadeInUp} className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/feature-client.png"
                alt="Client management dashboard showing progress tracking and program assignments"
                width={600}
                height={400}
                className="w-full h-auto"
                loading="lazy"
              />
            </motion.div>
          </motion.div>

          {/* Feature 4: Analytics */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20"
          >
            <motion.div variants={fadeInUp} className="rounded-xl overflow-hidden shadow-lg lg:order-1">
              <Image
                src="/images/feature-client.png"
                alt="Analytics dashboard showing client progress and business metrics"
                width={600}
                height={400}
                className="w-full h-auto"
                loading="lazy"
              />
            </motion.div>
            <div className="lg:order-2">
              <motion.h3
                variants={fadeInUp}
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
              >
                See Which Programs Drive Results
              </motion.h3>
              <motion.ul variants={staggerContainer} className="space-y-4">
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Client progress analytics show what's working</span>
                </motion.li>
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Revenue tracking across all training packages</span>
                </motion.li>
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Export reports to impress potential clients</span>
                </motion.li>
              </motion.ul>
            </div>
          </motion.div>

          {/* Feature 5: AI Workout Generation */}
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
                Let AI Handle Your Program Variations
                <span className="inline-block ml-2 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">SaaS Tier</span>
              </motion.h3>
              <motion.ul variants={staggerContainer} className="space-y-4">
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Generate infinite program variations for any goal</span>
                </motion.li>
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Customize for injuries, equipment, or time constraints</span>
                </motion.li>
                <motion.li variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Never run out of fresh programming ideas</span>
                </motion.li>
              </motion.ul>
            </div>
            <motion.div variants={fadeInUp} className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/feature-program.png"
                alt="AI workout generation interface creating custom programs"
                width={600}
                height={400}
                className="w-full h-auto"
                loading="lazy"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="testimonials" className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Bar */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-1">500+</div>
              <div className="text-gray-400">Exercises</div>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-1">1,200+</div>
              <div className="text-gray-400">Trainers</div>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-1">15,000+</div>
              <div className="text-gray-400">Programs Created</div>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-1">94%</div>
              <div className="text-gray-400">Time Savings</div>
            </motion.div>
          </motion.div>

          {/* Testimonials */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={fadeInUp} className="bg-white/10 rounded-xl p-8">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                "EvoFit Trainer cut my programming time from 4 hours to 30 minutes per client. I went from 12 clients to 28 clients without working weekends. Game changer."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">SC</span>
                </div>
                <div>
                  <div className="font-semibold">Sarah Chen, CPT</div>
                  <div className="text-gray-400 text-sm">Owner, Limitless Fitness Studio</div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-white/10 rounded-xl p-8">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                "The AI workout generator is unreal. I input client goals and limitations, and it creates programs better than what I was doing manually. My clients are seeing faster results."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">MR</span>
                </div>
                <div>
                  <div className="font-semibold">Marcus Rodriguez, NASM-CPT</div>
                  <div className="text-gray-400 text-sm">Online Training Specialist</div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-white/10 rounded-xl p-8">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                "Finally, a platform built BY trainers FOR trainers. Everything just works. No learning curve, no BS features I don't need. Just pure efficiency."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">JP</span>
                </div>
                <div>
                  <div className="font-semibold">Jennifer Park, ACSM-CPT</div>
                  <div className="text-gray-400 text-sm">12+ years experience, boutique gym owner</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-white py-20">
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
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              Choose Your Growth Plan
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Starter */}
            <motion.div variants={fadeInUp} className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-600 text-sm mb-4">For new trainers getting started</p>
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">$149</div>
                <div className="text-gray-500 text-sm">One-Time</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="text-gray-700">• Up to 9 clients</li>
                <li className="text-gray-700">• 500-program library access</li>
                <li className="text-gray-700">• Exercise browser (no downloads)</li>
                <li className="text-gray-700">• Email support</li>
                <li className="text-gray-700">• Lifetime updates</li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full text-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Get Starter Access
              </Link>
            </motion.div>

            {/* Professional - Recommended */}
            <motion.div variants={fadeInUp} className="bg-green-50 border-2 border-green-600 rounded-xl p-8 shadow-lg relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-green-600 text-white rounded-full text-sm font-semibold">
                ⭐ RECOMMENDED
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Professional</h3>
              <p className="text-gray-600 text-sm mb-4">For established trainers scaling up</p>
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">$249</div>
                <div className="text-gray-500 text-sm">One-Time</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="text-gray-700">• Up to 20 clients</li>
                <li className="text-gray-700">• 1,500-program library access</li>
                <li className="text-gray-700">• Custom branding on programs</li>
                <li className="text-gray-700">• Priority email support</li>
                <li className="text-gray-700">• Lifetime updates</li>
                <li className="text-gray-700">• Exercise video downloads</li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full text-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Get Professional Access
              </Link>
            </motion.div>

            {/* Enterprise */}
            <motion.div variants={fadeInUp} className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600 text-sm mb-4">For gym owners and large operations</p>
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">$349</div>
                <div className="text-gray-500 text-sm">One-Time</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="text-gray-700">• Unlimited clients</li>
                <li className="text-gray-700">• White-label platform</li>
                <li className="text-gray-700">• API access for integrations</li>
                <li className="text-gray-700">• Phone + email support</li>
                <li className="text-gray-700">• Lifetime updates</li>
                <li className="text-gray-700">• Multi-trainer team access</li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full text-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Get Enterprise Access
              </Link>
            </motion.div>

            {/* SaaS */}
            <motion.div variants={fadeInUp} className="bg-blue-50 border-2 border-blue-600 rounded-xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-2">SaaS</h3>
              <p className="text-gray-600 text-sm mb-4">For trainers wanting AI assistance</p>
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">$29</div>
                <div className="text-gray-500 text-sm">/Month</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="text-gray-700">• Up to 20 clients</li>
                <li className="text-gray-700">• AI workout generation</li>
                <li className="text-gray-700">• Custom program variations</li>
                <li className="text-gray-700">• Advanced analytics</li>
                <li className="text-gray-700">• Monthly feature updates</li>
                <li className="text-gray-700">• Cancel anytime</li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full text-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Free Trial
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative bg-gray-900 text-white py-20 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/cta-background.png"
            alt="Trainer helping client with workout"
            fill
            className="object-cover opacity-30"
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              Ready to 3x Your Client Capacity?
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-300 mb-10 max-w-3xl mx-auto"
            >
              Join 1,200+ trainers who've reclaimed their weekends while growing their business. No monthly fees. No complicated setup. Just results.
            </motion.p>

            <motion.form
              variants={fadeInUp}
              onSubmit={handleEmailSubmit}
              className="max-w-md mx-auto mb-6"
            >
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 border-none outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 border-none outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Subscribing...' : 'Get Lifetime Access Now'}
                </button>
              </div>
            </motion.form>

            {submitMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm ${submitMessage.includes('Success') ? 'text-green-400' : 'text-red-400'}`}
              >
                {submitMessage}
              </motion.div>
            )}

            <motion.p variants={fadeInUp} className="text-sm text-gray-400">
              Get instant access + free program templates
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="text-white text-lg font-semibold">EvoFit Trainer</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Scale your training business without burnout
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/exercises" className="hover:text-white transition-colors">Exercise Library</Link></li>
                <li><Link href="/programs" className="hover:text-white transition-colors">Program Templates</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Log In</Link></li>
                <li><Link href="/reset" className="hover:text-white transition-colors">Reset Password</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About EvoFit</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} EvoFit Trainer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}