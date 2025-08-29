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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { MultiLineChartProps } from '@/types/analytics';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function MultiLineChart({
  data,
  title,
  height = 400,
  yAxisLabel,
  showLegend = true,
}: MultiLineChartProps) {
  // Get all unique dates from all datasets
  const allDates = Array.from(
    new Set(
      data.flatMap(dataset => dataset.data.map(point => point.date))
    )
  ).sort();

  // Prepare chart data
  const chartData = {
    labels: allDates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }),
    datasets: data.map(dataset => ({
      label: dataset.name,
      data: allDates.map(date => {
        const point = dataset.data.find(p => p.date === date);
        return point ? point.value : null;
      }),
      borderColor: dataset.color,
      backgroundColor: `${dataset.color}20`,
      fill: false,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: dataset.color,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      borderWidth: 2,
      spanGaps: true, // Connect line even if there are null values
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#374151',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context: any) {
            const dataIndex = context[0].dataIndex;
            const originalDate = new Date(allDates[dataIndex]);
            return originalDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          },
          label: function(context: any) {
            const datasetLabel = context.dataset.label;
            const value = context.parsed.y;
            return value !== null ? `${datasetLabel}: ${value.toFixed(1)}` : `${datasetLabel}: No data`;
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
        },
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          color: '#374151',
          font: {
            size: 12,
            weight: 'normal',
          },
        },
        beginAtZero: false,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  // Calculate summary stats for each dataset
  const summaryStats = data.map(dataset => {
    const values = dataset.data
      .map(point => point.value)
      .filter(value => value !== null && value !== undefined);
    
    if (values.length === 0) {
      return {
        name: dataset.name,
        color: dataset.color,
        current: null,
        change: null,
        average: null,
      };
    }

    const current = values[values.length - 1];
    const change = values.length > 1 ? current - values[0] : 0;
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      name: dataset.name,
      color: dataset.color,
      current,
      change,
      average,
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex flex-wrap gap-6 mt-3">
          {summaryStats.map(stat => (
            <div key={stat.name} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stat.color }}
              />
              <div className="text-sm">
                <span className="text-gray-600">{stat.name}:</span>
                {stat.current !== null ? (
                  <>
                    <span className="font-medium text-gray-900 ml-1">
                      {stat.current.toFixed(1)}
                    </span>
                    {stat.change !== null && (
                      <span 
                        className={`ml-2 text-xs ${
                          stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ({stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400 ml-1">No data</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        {allDates.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">No data available</p>
              <p className="text-xs text-gray-400 mt-1">Record measurements to see comparison charts</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}