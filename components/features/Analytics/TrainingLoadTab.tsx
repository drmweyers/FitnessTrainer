'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { TrainingLoad } from '@/types/analytics';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface TrainingLoadTabProps {
  clientId?: string | null;
}

export default function TrainingLoadTab({ clientId }: TrainingLoadTabProps) {
  const [weekCount, setWeekCount] = React.useState(12);

  const { data: trainingLoad, isLoading } = useQuery<TrainingLoad[]>({
    queryKey: ['training-load', weekCount, clientId],
    queryFn: () => analyticsApi.getTrainingLoad(weekCount, clientId || undefined),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trainingLoad || trainingLoad.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No training load data yet</h3>
        <p className="text-gray-500">Complete workouts to track your training load over time.</p>
      </div>
    );
  }

  // Sort by date
  const sortedData = [...trainingLoad].sort(
    (a, b) => new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime()
  );

  // Prepare volume chart data
  const volumeChartData = {
    labels: sortedData.map(tl =>
      new Date(tl.weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Total Volume',
        data: sortedData.map(tl => tl.totalVolume),
        backgroundColor: '#3B82F6',
      },
    ],
  };

  const volumeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Weekly Training Volume',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Volume (kg)',
        },
      },
    },
  };

  // Prepare load ratio chart data
  const loadRatioChartData = {
    labels: sortedData.map(tl =>
      new Date(tl.weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Acute Load (7-day)',
        data: sortedData.map(tl => tl.acuteLoad),
        borderColor: '#F59E0B',
        backgroundColor: '#F59E0B20',
        tension: 0.4,
      },
      {
        label: 'Chronic Load (28-day)',
        data: sortedData.map(tl => tl.chronicLoad),
        borderColor: '#10B981',
        backgroundColor: '#10B98120',
        tension: 0.4,
      },
    ],
  };

  const loadRatioChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Acute vs Chronic Training Load',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Load',
        },
      },
    },
  };

  // Calculate current week stats
  const currentWeek = sortedData[sortedData.length - 1];
  const avgVolume = sortedData.reduce((sum, tl) => sum + tl.totalVolume, 0) / sortedData.length;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Time Range</h3>
          <div className="flex gap-2">
            {[4, 8, 12, 26].map(weeks => (
              <button
                key={weeks}
                onClick={() => setWeekCount(weeks)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  weekCount === weeks
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {weeks} Weeks
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Week Summary */}
      {currentWeek && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Volume</h3>
            <p className="text-2xl font-bold text-gray-900">{currentWeek.totalVolume.toFixed(0)} kg</p>
            <p className="text-xs text-gray-500 mt-1">This Week</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Training Days</h3>
            <p className="text-2xl font-bold text-gray-900">{currentWeek.trainingDays}</p>
            <p className="text-xs text-gray-500 mt-1">This Week</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Load Ratio</h3>
            <p className="text-2xl font-bold text-gray-900">{currentWeek.loadRatio.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {currentWeek.loadRatio > 1.5 ? 'High Risk' : currentWeek.loadRatio > 0.8 ? 'Optimal' : 'Low'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Avg Volume</h3>
            <p className="text-2xl font-bold text-gray-900">{avgVolume.toFixed(0)} kg</p>
            <p className="text-xs text-gray-500 mt-1">{weekCount} Week Average</p>
          </div>
        </div>
      )}

      {/* Volume Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div style={{ height: '350px' }}>
          <Bar data={volumeChartData} options={volumeChartOptions} />
        </div>
      </div>

      {/* Load Ratio Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div style={{ height: '350px' }}>
          <Line data={loadRatioChartData} options={loadRatioChartOptions} />
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Load Ratio Guide:</strong> The acute:chronic load ratio helps prevent injury. An optimal ratio is
            between 0.8-1.3. Ratios above 1.5 indicate high injury risk due to sudden training increases.
          </p>
        </div>
      </div>
    </div>
  );
}
