/**
 * Client Profile Page
 *
 * Main dashboard for viewing client information, assigned programs,
 * active workout status, and navigation to history and programs.
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useClient } from '@/hooks/useClients';

import { ClientProfile } from '@/components/clients/ClientProfile';
import { ClientWorkouts } from '@/components/clients/ClientWorkouts';
import { ClientPrograms } from '@/components/clients/ClientPrograms';
import { ClientProgress } from '@/components/clients/ClientProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Dumbbell, TrendingUp, ArrowLeft } from 'lucide-react';

export default function ClientProfilePage() {
  const params = useParams();
  const clientId = String(params.clientId);
  const [activeTab, setActiveTab] = useState<'overview' | 'workouts' | 'programs' | 'progress'>('overview');

  const { client, loading, error } = useClient(clientId);

  if (loading) {
    return (
      <>
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading client information...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !client) {
    return (
      <>
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Failed to load client information</p>
            <Link href="/clients">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const status = client?.trainerClient?.status || 'pending';
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-gray-100 text-gray-800',
    need_programming: 'bg-orange-100 text-orange-800',
    archived: 'bg-red-100 text-red-800',
  };

  const displayName = client?.displayName || client?.email;

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{displayName}&apos;s Dashboard</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.pending}>
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
                {client?.lastLoginAt && (
                  <span className="text-sm text-gray-500">
                    Last active {new Date(client.lastLoginAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Link href={`/workouts?clientId=${clientId}`}>
              <Button>
                <Dumbbell className="h-4 w-4 mr-2" />
                Create Workout
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === 'workouts'
                ? 'bg-primary text-primary-foreground'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('workouts')}
          >
            Workouts
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === 'programs'
                ? 'bg-primary text-primary-foreground'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('programs')}
          >
            Programs
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === 'progress'
                ? 'bg-primary text-primary-foreground'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('progress')}
          >
            Progress
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Client Profile */}
          <div className="lg:col-span-1">
            <ClientProfile client={client} />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <QuickStatCard
                    title="Active Programs"
                    value="2"
                    icon={<Calendar className="h-5 w-5 text-blue-600" />}
                  />
                  <QuickStatCard
                    title="Total Workouts"
                    value="24"
                    icon={<Dumbbell className="h-5 w-5 text-green-600" />}
                  />
                  <QuickStatCard
                    title="This Month"
                    value="8"
                    icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
                  />
                </div>

                {/* Recent Workouts */}
                <ClientWorkouts clientId={clientId} limit={5} />

                {/* Quick Actions */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Link href={`/clients/${clientId}/programs`}>
                        <Button variant="outline" className="w-full justify-start">
                          <Calendar className="h-4 w-4 mr-2" />
                          Assign Program
                        </Button>
                      </Link>
                      <Link href={`/clients/${clientId}/history`}>
                        <Button variant="outline" className="w-full justify-start">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          View Full History
                        </Button>
                      </Link>
                      <Link href={`/workouts/new?clientId=${clientId}`}>
                        <Button variant="outline" className="w-full justify-start">
                          <Dumbbell className="h-4 w-4 mr-2" />
                          Create Workout
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full justify-start">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'workouts' && (
              <ClientWorkouts clientId={clientId} />
            )}

            {activeTab === 'programs' && (
              <ClientPrograms clientId={clientId} />
            )}

            {activeTab === 'progress' && (
              <ClientProgress clientId={clientId} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

interface QuickStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function QuickStatCard({ title, value, icon }: QuickStatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          </div>
          <div className="p-3 bg-gray-100 rounded-full">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
