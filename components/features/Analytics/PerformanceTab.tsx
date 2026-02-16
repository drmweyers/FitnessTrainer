'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { PerformanceMetric } from '@/types/analytics';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PersonalBest {
  exercise: string;
  metric: string;
  value: number;
  date: string;
}

interface PerformanceTabProps {
  clientId?: string | null;
}

export default function PerformanceTab({ clientId }: PerformanceTabProps) {
  const { data: metrics, isLoading: metricsLoading } = useQuery<PerformanceMetric[]>({
    queryKey: ['performance-metrics', clientId],
    queryFn: () => analyticsApi.getPerformanceMetrics(undefined, clientId || undefined),
  });

  const { data: personalBests, isLoading: bestsLoading } = useQuery<PersonalBest[]>({
    queryKey: ['personal-bests', clientId],
    queryFn: () => analyticsApi.getPersonalBests(),
  });

  const isLoading = metricsLoading || bestsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No performance data yet</h3>
        <p className="text-gray-500">Complete workouts to track your performance over time.</p>
      </div>
    );
  }

  // Group metrics by exercise
  const exerciseGroups = metrics.reduce((acc, metric) => {
    const key = metric.exerciseId || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(metric);
    return acc;
  }, {} as Record<string, PerformanceMetric[]>);

  // Prepare chart data for one_rm metrics
  const oneRmMetrics = metrics
    .filter(m => m.metricType === 'one_rm')
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  const chartData = {
    labels: oneRmMetrics.map(m =>
      new Date(m.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'One Rep Max (kg)',
        data: oneRmMetrics.map(m => m.value),
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F620',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  // Prepare personal bests chart
  const bestsChartData = personalBests ? {
    labels: personalBests.slice(0, 10).map(pb => pb.exercise.slice(0, 20)),
    datasets: [
      {
        label: 'Personal Bests',
        data: personalBests.slice(0, 10).map(pb => pb.value),
        backgroundColor: '#10B981',
      },
    ],
  } : null;

  const bestsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Personal Bests */}
      {personalBests && personalBests.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Bests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {personalBests.slice(0, 6).map((pb, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">{pb.metric}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(pb.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1 truncate" title={pb.exercise}>{pb.exercise}</p>
                <p className="text-2xl font-bold text-blue-600">{pb.value} kg</p>
              </div>
            ))}
          </div>

          {bestsChartData && (
            <div style={{ height: '300px' }}>
              <Bar data={bestsChartData} options={bestsChartOptions} />
            </div>
          )}
        </div>
      )}

      {/* Performance Over Time */}
      {oneRmMetrics.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Progress</h2>
          <div style={{ height: '350px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Performance Metrics by Type */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.slice(0, 20).map((metric, index) => (
                <tr key={metric.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(metric.recordedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {metric.metricType.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.value} {metric.unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {metric.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {metrics.length > 20 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing 20 of {metrics.length} metrics
          </div>
        )}
      </div>
    </div>
  );
}
