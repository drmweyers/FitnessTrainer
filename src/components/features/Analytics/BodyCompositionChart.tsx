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
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { BodyCompositionChartProps } from '@/types/analytics';

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

export default function BodyCompositionChart({
  data,
  height = 400,
}: BodyCompositionChartProps) {
  // Process data for dual y-axis chart
  const labels = data.map(point => {
    const date = new Date(point.date);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  });

  const chartData = {
    labels,
    datasets: [
      // Weight dataset (left y-axis)
      {
        label: 'Weight',
        data: data.map(point => point.weight),
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F620',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        borderWidth: 2,
        yAxisID: 'y',
      },
      // Muscle mass dataset (left y-axis)
      ...(data.some(point => point.muscleMass) ? [{
        label: 'Muscle Mass',
        data: data.map(point => point.muscleMass || null),
        borderColor: '#10B981',
        backgroundColor: '#10B98120',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        borderWidth: 2,
        spanGaps: true,
        yAxisID: 'y',
      }] : []),
      // Body fat percentage dataset (right y-axis)
      ...(data.some(point => point.bodyFat) ? [{
        label: 'Body Fat %',
        data: data.map(point => point.bodyFat || null),
        borderColor: '#F59E0B',
        backgroundColor: '#F59E0B20',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#F59E0B',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        borderWidth: 2,
        spanGaps: true,
        yAxisID: 'y1',
      }] : []),
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#374151',
          font: {
            size: 12,
          },
          filter: function(item, chart) {
            // Only show legend items that have data
            const dataset = chart.data.datasets[item.datasetIndex!];
            return dataset.data.some((value: any) => value !== null && value !== undefined);
          },
        },
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
            const originalDate = new Date(data[dataIndex].date);
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
            
            if (value === null || value === undefined) {
              return `${datasetLabel}: No data`;
            }
            
            if (datasetLabel === 'Body Fat %') {
              return `${datasetLabel}: ${value.toFixed(1)}%`;
            } else {
              return `${datasetLabel}: ${value.toFixed(1)} kg`;
            }
          },
          afterBody: function(context: any) {
            const dataIndex = context[0].dataIndex;
            const currentData = data[dataIndex];
            
            // Calculate body fat mass and lean mass if we have the data
            if (currentData.weight && currentData.bodyFat) {
              const fatMass = (currentData.weight * currentData.bodyFat) / 100;
              const leanMass = currentData.weight - fatMass;
              
              return [
                '',
                `Fat Mass: ${fatMass.toFixed(1)} kg`,
                `Lean Mass: ${leanMass.toFixed(1)} kg`,
              ];
            }
            
            return [];
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
        type: 'linear',
        display: true,
        position: 'left',
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
            return `${value} kg`;
          },
        },
        title: {
          display: true,
          text: 'Weight / Muscle Mass (kg)',
          color: '#374151',
          font: {
            size: 12,
          },
        },
      },
      y1: {
        type: 'linear',
        display: data.some(point => point.bodyFat),
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return `${value}%`;
          },
        },
        title: {
          display: true,
          text: 'Body Fat (%)',
          color: '#374151',
          font: {
            size: 12,
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  // Calculate composition insights
  const insights = calculateCompositionInsights(data);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Body Composition</h3>
        <p className="text-sm text-gray-500 mt-1">Track changes in weight, muscle mass, and body fat percentage</p>
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
              <p className="text-sm">No body composition data</p>
              <p className="text-xs text-gray-400 mt-1">Record weight and body fat measurements to track composition changes</p>
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      {insights && data.length > 1 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Composition Insights</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.weightChange !== 0 && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Weight Change</p>
                <p className={`text-lg font-semibold ${insights.weightChange >= 0 ? 'text-blue-600' : 'text-blue-800'}`}>
                  {insights.weightChange >= 0 ? '+' : ''}{insights.weightChange.toFixed(1)} kg
                </p>
              </div>
            )}
            
            {insights.bodyFatChange !== 0 && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Body Fat Change</p>
                <p className={`text-lg font-semibold ${insights.bodyFatChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {insights.bodyFatChange >= 0 ? '+' : ''}{insights.bodyFatChange.toFixed(1)}%
                </p>
              </div>
            )}
            
            {insights.muscleMassChange !== 0 && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Muscle Mass Change</p>
                <p className={`text-lg font-semibold ${insights.muscleMassChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {insights.muscleMassChange >= 0 ? '+' : ''}{insights.muscleMassChange.toFixed(1)} kg
                </p>
              </div>
            )}
          </div>
          
          {insights.recommendation && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">💡 Insight:</span> {insights.recommendation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function calculateCompositionInsights(data: Array<{ date: string; weight: number; bodyFat?: number; muscleMass?: number }>) {
  if (data.length < 2) return null;

  const first = data[0];
  const last = data[data.length - 1];

  const weightChange = last.weight - first.weight;
  const bodyFatChange = (last.bodyFat && first.bodyFat) ? last.bodyFat - first.bodyFat : 0;
  const muscleMassChange = (last.muscleMass && first.muscleMass) ? last.muscleMass - first.muscleMass : 0;

  let recommendation = '';

  // Generate recommendations based on changes
  if (weightChange > 0 && bodyFatChange < 0 && muscleMassChange > 0) {
    recommendation = 'Excellent! You\'re gaining muscle while losing fat - ideal body recomposition.';
  } else if (weightChange < 0 && bodyFatChange < 0) {
    recommendation = 'Great progress! You\'re losing weight and body fat. Consider adding strength training to preserve muscle mass.';
  } else if (muscleMassChange > 0 && weightChange > 0) {
    recommendation = 'You\'re building muscle mass. Monitor body fat to ensure healthy weight gain.';
  } else if (bodyFatChange > 0) {
    recommendation = 'Body fat has increased. Consider adjusting your diet and increasing cardio activity.';
  } else if (Math.abs(weightChange) < 1 && Math.abs(bodyFatChange) < 1) {
    recommendation = 'Your body composition is stable. This can be good for maintenance phases.';
  }

  return {
    weightChange,
    bodyFatChange,
    muscleMassChange,
    recommendation,
  };
}