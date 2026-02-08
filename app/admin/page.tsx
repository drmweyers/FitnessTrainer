'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { tokenUtils } from '@/lib/api/auth'
import {
  Users,
  UserCheck,
  ClipboardList,
  Dumbbell,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

interface DashboardMetrics {
  totalUsers: number
  totalTrainers: number
  totalClients: number
  totalAdmins: number
  newThisWeek: number
  newThisMonth: number
  newLastMonth: number
  activeUsers: number
  totalPrograms: number
  totalWorkouts: number
  totalConnections: number
}

interface RecentSignup {
  id: string
  name: string
  email: string
  role: string
  signupDate: string
  isActive: boolean
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { accessToken } = tokenUtils.getTokens()
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (data.success) {
        setMetrics(data.data.metrics)
        setRecentSignups(data.data.recentSignups)
      } else {
        setError(data.error || 'Failed to load metrics')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const monthTrend = metrics
    ? metrics.newThisMonth - metrics.newLastMonth
    : 0

  const metricCards = [
    {
      label: 'Total Users',
      value: metrics?.totalUsers ?? 0,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      detail: `${metrics?.totalTrainers ?? 0} trainers, ${metrics?.totalClients ?? 0} clients`,
    },
    {
      label: 'Active Users',
      value: metrics?.activeUsers ?? 0,
      icon: UserCheck,
      color: 'bg-green-50 text-green-600',
      detail: 'Active in last 7 days',
    },
    {
      label: 'Total Programs',
      value: metrics?.totalPrograms ?? 0,
      icon: ClipboardList,
      color: 'bg-purple-50 text-purple-600',
      detail: `${metrics?.totalConnections ?? 0} trainer-client connections`,
    },
    {
      label: 'Workouts Completed',
      value: metrics?.totalWorkouts ?? 0,
      icon: Dumbbell,
      color: 'bg-orange-50 text-orange-600',
      detail: `${metrics?.newThisWeek ?? 0} new users this week`,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-gray-500">
            Platform statistics and recent activity
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">{card.label}</span>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {card.value.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-gray-500">{card.detail}</p>
            </div>
          )
        })}
      </div>

      {/* Growth Indicator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h2>
        <div className="flex items-center gap-6">
          <div>
            <span className="text-sm text-gray-500">New this month</span>
            <div className="text-2xl font-bold text-gray-900">{metrics?.newThisMonth ?? 0}</div>
          </div>
          <div className="flex items-center gap-1">
            {monthTrend >= 0 ? (
              <TrendingUp size={20} className="text-green-500" />
            ) : (
              <TrendingDown size={20} className="text-red-500" />
            )}
            <span className={`text-sm font-medium ${monthTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthTrend >= 0 ? '+' : ''}{monthTrend} vs last month
            </span>
          </div>
          <div className="ml-auto">
            <span className="text-sm text-gray-500">Last month</span>
            <div className="text-lg font-semibold text-gray-700">{metrics?.newLastMonth ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Signups</h2>
          <Link
            href="/admin/users"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all users
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentSignups.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent signups
            </div>
          ) : (
            recentSignups.map((signup) => (
              <Link
                key={signup.id}
                href={`/admin/users/${signup.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                    {signup.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{signup.name}</div>
                    <div className="text-xs text-gray-500">{signup.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${signup.role === 'admin' ? 'bg-red-100 text-red-700' :
                      signup.role === 'trainer' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'}
                  `}>
                    {signup.role}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(signup.signupDate).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
