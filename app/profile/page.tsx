'use client';

import React, { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CertExpirationAlert, { ExpiringCertification } from '@/components/features/Profile/CertExpirationAlert';


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
    whatsappLink: string | null;
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
  const { user, isLoading } = useRequireAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expiringCerts, setExpiringCerts] = useState<ExpiringCertification[]>([]);

  useEffect(() => {
    if (isLoading || !user) return;

    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    fetch('/api/profiles/me', { headers })
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

    // Load expiring certifications for trainers
    if (user.role === 'trainer') {
      fetch('/api/profiles/certifications/expiring', { headers })
        .then(res => res.json())
        .then(result => {
          if (result.success) setExpiringCerts(result.data);
        })
        .catch(() => {
          // Non-critical — silently ignore cert expiry fetch errors
        });
    }
  }, [isLoading, user]);

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
        {/* Certification Expiration Alerts (trainers only) */}
        {user?.role === 'trainer' && expiringCerts.length > 0 && (
          <CertExpirationAlert certifications={expiringCerts} />
        )}

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
              {profile?.userProfile?.whatsappLink && (
                <div className="pt-1">
                  <a
                    href={
                      profile.userProfile.whatsappLink.startsWith('http')
                        ? profile.userProfile.whatsappLink
                        : `https://${profile.userProfile.whatsappLink}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Contact on WhatsApp
                  </a>
                </div>
              )}
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
