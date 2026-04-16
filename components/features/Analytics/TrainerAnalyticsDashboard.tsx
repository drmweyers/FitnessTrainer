'use client'

import React, { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, UserPlus, Flame, TrendingUp, Activity, ChevronRight } from 'lucide-react'
import ClientSelector from './ClientSelector'

interface ClientRow {
  id: string
  name: string
  email: string
  status: string
  connectedAt: string
  workoutStreak: number
}

interface ClientOverview {
  totalClients: number
  activeClients: number
  inactiveClients: number
  newThisMonth: number
}

interface TrainerAnalyticsDashboardProps {
  onClientSelect: (clientId: string | null) => void
}

export default function TrainerAnalyticsDashboard({ onClientSelect }: TrainerAnalyticsDashboardProps) {
  const [overview, setOverview] = useState<ClientOverview | null>(null)
  const [clients, setClients] = useState<ClientRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    fetch('/api/dashboard/stats', {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.data) {
          setOverview(result.data.clientOverview ?? null)
          setClients(result.data.clients ?? [])
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Client search to drill into individual analytics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">View Client Analytics</h2>
        <p className="text-sm text-gray-500 mb-4">Select a client to view their body composition, training load, goals, and performance charts.</p>
        <ClientSelector selectedClientId={null} onClientChange={onClientSelect} />
      </div>

      {/* KPI cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Users className="h-5 w-5 text-blue-600" />}
            bg="bg-blue-50"
            label="Total Clients"
            value={overview.totalClients}
          />
          <KpiCard
            icon={<UserCheck className="h-5 w-5 text-green-600" />}
            bg="bg-green-50"
            label="Active"
            value={overview.activeClients}
          />
          <KpiCard
            icon={<UserX className="h-5 w-5 text-yellow-600" />}
            bg="bg-yellow-50"
            label="Inactive"
            value={overview.inactiveClients}
          />
          <KpiCard
            icon={<UserPlus className="h-5 w-5 text-purple-600" />}
            bg="bg-purple-50"
            label="New This Month"
            value={overview.newThisMonth}
          />
        </div>
      )}

      {/* Client roster with streaks */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Client Roster
          </h2>
          <span className="text-sm text-gray-400">{clients.length} shown</span>
        </div>

        {clients.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No clients yet. Add clients from the dashboard.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {clients.map((client) => (
              <li key={client.id}>
                <button
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left group"
                  onClick={() => onClientSelect(client.id)}
                >
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700 flex-shrink-0">
                    {client.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate capitalize">{client.name}</p>
                    <p className="text-xs text-gray-500 truncate">{client.email}</p>
                  </div>

                  {/* Status badge */}
                  <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {client.status}
                  </span>

                  {/* Streak */}
                  {client.workoutStreak > 0 && (
                    <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      <Flame className="h-3 w-3" />
                      {client.workoutStreak}d
                    </span>
                  )}

                  {/* View analytics CTA */}
                  <span className="flex items-center gap-1 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Analytics
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  bg,
  label,
  value,
}: {
  icon: React.ReactNode
  bg: string
  label: string
  value: number
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
