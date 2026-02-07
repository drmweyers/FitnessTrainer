'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProfileData {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  userProfile: {
    bio: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    phone: string | null;
    timezone: string | null;
    preferredUnits: string;
    isPublic: boolean;
    profilePhotoUrl: string | null;
  } | null;
  userGoals: Array<{
    id: string;
    goalType: string;
    specificGoal: string | null;
    isActive: boolean;
  }>;
  profileCompletion: {
    completionPercentage: number;
    basicInfo: boolean;
    profilePhoto: boolean;
    healthInfo: boolean;
    goalsSet: boolean;
    measurements: boolean;
  } | null;
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/login');
      return;
    }

    if (!isLoading && user) {
      const token = localStorage.getItem('accessToken');
      fetch('/api/profiles/me', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setProfile(result.data);
          } else {
            setError(result.error || 'Failed to load profile');
          }
        })
        .catch(() => setError('Failed to load profile'))
        .finally(() => setIsDataLoading(false));
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || isDataLoading) {
    return (
      <DashboardLayout title="My Profile" subtitle="View your profile information">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="My Profile" subtitle="View your profile information">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  const completionPct = profile?.profileCompletion?.completionPercentage ?? 0;
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const displayName =
    profile?.userProfile
      ? [profile.userProfile.bio ? '' : ''].filter(Boolean).join(' ') || profile.email.split('@')[0]
      : profile?.email.split('@')[0] ?? 'User';

  return (
    <DashboardLayout
      title="My Profile"
      subtitle="View and manage your profile"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Profile' },
      ]}
      actions={
        <div className="flex space-x-2">
          <Link href="/profile/edit">
            <Button>Edit Profile</Button>
          </Link>
          <Link href="/profile/health">
            <Button variant="outline">Health Info</Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6 max-w-4xl">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold shrink-0">
                {(profile?.email?.[0] ?? 'U').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
                <p className="text-gray-500">{profile?.email}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {profile?.role}
                  </span>
                  <span>Joined {joinDate}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Completion */}
        {profile?.profileCompletion && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-medium">{completionPct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                {[
                  { label: 'Basic Info', done: profile.profileCompletion.basicInfo },
                  { label: 'Photo', done: profile.profileCompletion.profilePhoto },
                  { label: 'Health', done: profile.profileCompletion.healthInfo },
                  { label: 'Goals', done: profile.profileCompletion.goalsSet },
                  { label: 'Measurements', done: profile.profileCompletion.measurements },
                ].map(item => (
                  <div key={item.label} className="flex items-center space-x-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${item.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {item.done ? '\u2713' : '\u2022'}
                    </span>
                    <span className={item.done ? 'text-gray-900' : 'text-gray-400'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Bio</span>
                <span className="text-gray-900 text-right max-w-[60%]">
                  {profile?.userProfile?.bio || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date of Birth</span>
                <span className="text-gray-900">
                  {profile?.userProfile?.dateOfBirth
                    ? new Date(profile.userProfile.dateOfBirth).toLocaleDateString()
                    : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gender</span>
                <span className="text-gray-900 capitalize">
                  {profile?.userProfile?.gender || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-900">{profile?.userProfile?.phone || 'Not set'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Timezone</span>
                <span className="text-gray-900">{profile?.userProfile?.timezone || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Units</span>
                <span className="text-gray-900 capitalize">
                  {profile?.userProfile?.preferredUnits || 'Metric'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Profile Visibility</span>
                <span className="text-gray-900">
                  {profile?.userProfile?.isPublic !== false ? 'Public' : 'Private'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Goals */}
        {profile?.userGoals && profile.userGoals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile.userGoals.map(goal => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <span className="font-medium text-gray-900 capitalize">
                        {goal.goalType.replace(/_/g, ' ')}
                      </span>
                      {goal.specificGoal && (
                        <p className="text-sm text-gray-500 mt-0.5">{goal.specificGoal}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
