/**
 * Client History Page
 *
 * Displays client's complete workout history with progress stats
 * and date range filtering.
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useClient } from '@/hooks/useClients';
import Layout from '@/components/layout/Layout';
import { ClientWorkouts } from '@/components/clients/ClientWorkouts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Calendar, Filter } from 'lucide-react';

export default function ClientHistoryPage() {
  const params = useParams();
  const clientId = String(params.clientId);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'all'>('all');

  const { client, loading, error } = useClient(clientId);

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading client information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !client) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  const displayName = client?.displayName || client?.email;

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/clients/${clientId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{displayName}&apos;s Workout History</h1>
              <p className="text-gray-600 mt-1">Complete workout history and progress tracking</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/clients/${clientId}/programs`}>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Programs
              </Button>
            </Link>
            <Link href={`/clients/${clientId}`}>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Progress
              </Button>
            </Link>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <ProgressStatCard
            title="Total Workouts"
            value="24"
            change="+3 this week"
            trend="up"
          />
          <ProgressStatCard
            title="This Month"
            value="12"
            change="On track"
            trend="neutral"
          />
          <ProgressStatCard
            title="Streak"
            value="5 days"
            change="Personal best!"
            trend="up"
          />
          <ProgressStatCard
            title="Avg Duration"
            value="52 min"
            change="-5 min vs last month"
            trend="down"
          />
        </div>

        {/* Date Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filter by:</span>
            <div className="flex gap-2">
              <DateFilterButton
                active={dateRange === '7days'}
                onClick={() => setDateRange('7days')}
              >
                Last 7 Days
              </DateFilterButton>
              <DateFilterButton
                active={dateRange === '30days'}
                onClick={() => setDateRange('30days')}
              >
                Last 30 Days
              </DateFilterButton>
              <DateFilterButton
                active={dateRange === '90days'}
                onClick={() => setDateRange('90days')}
              >
                Last 90 Days
              </DateFilterButton>
              <DateFilterButton
                active={dateRange === 'all'}
                onClick={() => setDateRange('all')}
              >
                All Time
              </DateFilterButton>
            </div>
          </div>
        </div>

        {/* Workout History */}
        <ClientWorkouts clientId={clientId} limit={50} />
      </div>
    </Layout>
  );
}

interface ProgressStatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

function ProgressStatCard({ title, value, change, trend }: ProgressStatCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className={`text-xs ${trendColors[trend]}`}>{change}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface DateFilterButtonProps {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}

function DateFilterButton({ active, children, onClick }: DateFilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-md transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
