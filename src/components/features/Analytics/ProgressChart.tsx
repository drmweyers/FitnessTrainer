'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ProgressChartProps } from '@/types/analytics';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TimeRangeOption {
  value: '7d' | '30d' | '3m' | '6m' | '1y';
  label: string;
}

const TIME_RANGES: TimeRangeOption[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
];

export default function ProgressChart({
  data,
  title,
  unit,
  height = 300,
  showTrendLine = true,
  color = '#3B82F6',
  timeRange = '3m',
  onTimeRangeChange,
}: ProgressChartProps) {
  // Process data for Chart.js
  const chartData = {
    labels: data.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(timeRange === '1y' && { year: '2-digit' }),
      });
    }),
    datasets: [
      {
        label: title,
        data: data.map(point => point.value),
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: showTrendLine,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  };

  // Calculate trend line if requested
  if (showTrendLine && data.length > 1) {
    const trendData = calculateTrendLine(data.map(point => point.value));
    chartData.datasets.push({
      label: 'Trend',
      data: trendData,
      borderColor: `${color}80`,
      backgroundColor: 'transparent',
      fill: false,
      tension: 0,
      pointRadius: 0,
      pointHoverRadius: 0,
      borderWidth: 1,
      borderDash: [5, 5],
    } as any);
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: color,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context: any) {
            const dataIndex = context[0].dataIndex;
            const originalDate = new Date(data[dataIndex].date);
            return originalDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          },
          label: function(context: any) {
            const value = context.parsed.y;
            const dataIndex = context.dataIndex;
            const currentData = data[dataIndex];
            
            let label = `${title}: ${value.toFixed(1)} ${unit}`;
            
            // Add change from previous if available
            if (dataIndex > 0) {
              const previousValue = data[dataIndex - 1].value;
              const change = value - previousValue;
              const changeText = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
              label += `\nChange: ${changeText} ${unit}`;
            }
            
            // Add custom label if present
            if (currentData.label) {
              label += `\nNote: ${currentData.label}`;
            }
            
            return label.split('\n');
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return `${value} ${unit}`;
          },
        },
        beginAtZero: false,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    elements: {
      point: {
        hoverBackgroundColor: color,
      },
    },
  };

  // Calculate statistics
  const stats = calculateStats(data.map(point => point.value));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
            <span>Current: {stats.current?.toFixed(1)} {unit}</span>
            <span className={`flex items-center ${stats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.trend >= 0 ? (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7h-10" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7l9.2 9.2M17 7v10H7" />
                </svg>
              )}
              {stats.trend >= 0 ? '+' : ''}{stats.trend?.toFixed(1)} {unit}
            </span>
          </div>
        </div>

        {/* Time Range Selector */}
        {onTimeRangeChange && (
          <div className="flex mt-4 sm:mt-0">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {TIME_RANGES.map(range => (
                <button
                  key={range.value}
                  onClick={() => onTimeRangeChange(range.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    timeRange === range.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        {data.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">No data available</p>
              <p className="text-xs text-gray-400 mt-1">Start recording measurements to see your progress</p>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      {data.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-500">Average</p>
            <p className="text-lg font-semibold text-gray-900">{stats.average?.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Best</p>
            <p className="text-lg font-semibold text-green-600">{stats.max?.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Change</p>
            <p className={`text-lg font-semibold ${stats.totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.totalChange >= 0 ? '+' : ''}{stats.totalChange?.toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Data Points</p>
            <p className="text-lg font-semibold text-gray-900">{data.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate trend line using linear regression
function calculateTrendLine(values: number[]): number[] {
  if (values.length < 2) return values;

  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return x.map(xi => slope * xi + intercept);
}

// Helper function to calculate chart statistics
function calculateStats(values: number[]) {
  if (values.length === 0) {
    return {
      current: 0,
      average: 0,
      max: 0,
      min: 0,
      trend: 0,
      totalChange: 0,
    };
  }

  const current = values[values.length - 1];
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const totalChange = values.length > 1 ? current - values[0] : 0;
  
  // Calculate trend (recent vs older averages)
  let trend = 0;
  if (values.length >= 4) {
    const recentAvg = values.slice(-2).reduce((a, b) => a + b, 0) / 2;
    const olderAvg = values.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    trend = recentAvg - olderAvg;
  } else if (values.length >= 2) {
    trend = current - values[values.length - 2];
  }

  return {
    current,
    average,
    max,
    min,
    trend,
    totalChange,
  };
}