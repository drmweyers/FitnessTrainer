'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { tokenUtils } from '@/lib/api/auth'
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  ClipboardList,
  Dumbbell,
  Users,
  Save,
} from 'lucide-react'

interface UserDetail {
  id: string
  email: string
  name: string
  firstName: string | null
  lastName: string | null
  role: string
  isActive: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string | null
  lastLoginAt: string | null
  bio: string | null
  phone: string | null
  avatarUrl: string | null
  stats: {
    programsCreated: number
    workoutsCompleted: number
    connections: number
  }
}

export default function AdminUserDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Editable fields
  const [editRole, setEditRole] = useState('')
  const [editActive, setEditActive] = useState(false)
  const [editVerified, setEditVerified] = useState(false)

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true)
      const { accessToken } = tokenUtils.getTokens()
      const res = await fetch(`/api/admin/users/${params.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.data)
        setEditRole(data.data.role)
        setEditActive(data.data.isActive)
        setEditVerified(data.data.isVerified)
      }
    } catch {
      // Error handled silently
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const handleSave = async () => {
    if (!user) return
    try {
      setIsSaving(true)
      setSaveMessage(null)
      const { accessToken } = tokenUtils.getTokens()
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: editRole,
          isActive: editActive,
          isVerified: editVerified,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSaveMessage({ type: 'success', text: 'User updated successfully' })
        fetchUser()
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'Failed to update' })
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to connect to server' })
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const hasChanges = user && (
    editRole !== user.role ||
    editActive !== user.isActive ||
    editVerified !== user.isVerified
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-64" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <Link href="/admin/users" className="mt-4 text-blue-600 hover:text-blue-700">
          Back to users
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to users
      </Link>

      {/* User Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Mail size={14} />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Phone size={14} />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className={`
            inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
            ${user.role === 'admin' ? 'bg-red-100 text-red-700' :
              user.role === 'trainer' ? 'bg-blue-100 text-blue-700' :
              'bg-green-100 text-green-700'}
          `}>
            {user.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Calendar size={14} />
                  Joined
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Clock size={14} />
                  Last Login
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(user.lastLoginAt)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Shield size={14} />
                  Status
                </dt>
                <dd className="mt-1 flex items-center gap-2">
                  {user.isActive ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle size={14} /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      <XCircle size={14} /> Inactive
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Mail size={14} />
                  Email Verified
                </dt>
                <dd className="mt-1 flex items-center gap-2">
                  {user.isVerified ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle size={14} /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-yellow-600">
                      <XCircle size={14} /> Unverified
                    </span>
                  )}
                </dd>
              </div>
            </dl>
            {user.bio && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Bio</dt>
                <dd className="text-sm text-gray-700">{user.bio}</dd>
              </div>
            )}
          </div>

          {/* Activity Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <ClipboardList size={24} className="mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{user.stats.programsCreated}</div>
                <div className="text-xs text-gray-500">Programs</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Dumbbell size={24} className="mx-auto text-orange-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{user.stats.workoutsCompleted}</div>
                <div className="text-xs text-gray-500">Workouts</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users size={24} className="mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{user.stats.connections}</div>
                <div className="text-xs text-gray-500">Connections</div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Controls</h2>
            <div className="space-y-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="client">Client</option>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Active</label>
                <button
                  onClick={() => setEditActive(!editActive)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${editActive ? 'bg-green-500' : 'bg-gray-300'}
                  `}
                >
                  <span className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${editActive ? 'translate-x-6' : 'translate-x-1'}
                  `} />
                </button>
              </div>

              {/* Verified Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Email Verified</label>
                <button
                  onClick={() => setEditVerified(!editVerified)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${editVerified ? 'bg-green-500' : 'bg-gray-300'}
                  `}
                >
                  <span className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${editVerified ? 'translate-x-6' : 'translate-x-1'}
                  `} />
                </button>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={`
                  w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${hasChanges
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>

              {/* Save message */}
              {saveMessage && (
                <p className={`text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMessage.text}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
