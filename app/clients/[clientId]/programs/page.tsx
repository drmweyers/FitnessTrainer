/**
 * Client Programs Page
 *
 * Displays programs assigned to a client with progress tracking
 * and upcoming workouts.
 */

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useClient } from '@/hooks/useClients';

import { ClientPrograms } from '@/components/clients/ClientPrograms';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, Plus, TrendingUp } from 'lucide-react';

export default function ClientProgramsPage() {
  const params = useParams();
  const clientId = String(params.clientId);

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

  const displayName = client?.displayName || client?.email;

  // Mock upcoming workouts
  const upcomingWorkouts = [
    { id: '1', name: 'Leg Day Strength', date: '2024-01-31', time: '09:00 AM' },
    { id: '2', name: 'Upper Body Hypertrophy', date: '2024-02-02', time: '10:00 AM' },
    { id: '3', name: 'HIIT Cardio Session', date: '2024-02-04', time: '08:00 AM' },
  ];

  return (
    <>
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
              <h1 className="text-2xl font-bold text-gray-800">{displayName}&apos;s Programs</h1>
              <p className="text-gray-600 mt-1">Assigned programs and upcoming workouts</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/clients/${clientId}/history`}>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                History
              </Button>
            </Link>
            <Link href={`/programs?assign=${clientId}`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Program
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Programs */}
          <div className="lg:col-span-2">
            <ClientPrograms clientId={clientId} />
          </div>

          {/* Sidebar - Upcoming Workouts */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Upcoming Workouts
                </h3>

                {upcomingWorkouts.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingWorkouts.map((workout) => (
                      <div
                        key={workout.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <p className="font-medium text-gray-800">{workout.name}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(workout.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {workout.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No upcoming workouts</p>
                    <Link href={`/workouts/new?clientId=${clientId}`}>
                      <Button variant="outline" size="sm">
                        Schedule Workout
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Program Stats */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Program Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Current Week</span>
                      <span className="font-medium">Week 5 of 12</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: '42%' }}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500">Overall Completion</p>
                    <p className="text-2xl font-bold text-gray-800">65%</p>
                    <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
