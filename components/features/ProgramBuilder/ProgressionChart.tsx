'use client';

import React from 'react';

export interface ProgressionChartExercise {
  name: string;
  startWeight: number;
  weeklyIncrease: number;
}

interface ProgressionChartProps {
  exercises: ProgressionChartExercise[];
  weeks: number;
}

/** Palette for multiple exercise lines */
const LINE_COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#dc2626', // red-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#0891b2', // cyan-600
];

const SVG_WIDTH = 480;
const SVG_HEIGHT = 220;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

/**
 * ProgressionChart renders an SVG line chart projecting weight progression
 * across the program weeks for each exercise.
 */
const ProgressionChart: React.FC<ProgressionChartProps> = ({ exercises, weeks }) => {
  if (exercises.length === 0) {
    return (
      <div data-testid="progression-chart" className="flex flex-col items-center justify-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 text-gray-300">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <p>No exercises to display</p>
      </div>
    );
  }

  const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
  const chartHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;

  // Compute all data points
  const allDataPoints = exercises.map(ex => {
    return Array.from({ length: weeks }, (_, i) => ({
      week: i + 1,
      weight: ex.startWeight + i * ex.weeklyIncrease,
    }));
  });

  // Compute y-axis range across all exercises
  const allWeights = allDataPoints.flatMap(pts => pts.map(p => p.weight));
  const minWeight = Math.floor(Math.min(...allWeights) * 0.95);
  const maxWeight = Math.ceil(Math.max(...allWeights) * 1.05);
  const weightRange = maxWeight - minWeight || 1;

  const xScale = (week: number) =>
    PADDING.left + ((week - 1) / Math.max(weeks - 1, 1)) * chartWidth;

  const yScale = (weight: number) =>
    PADDING.top + chartHeight - ((weight - minWeight) / weightRange) * chartHeight;

  // Y-axis tick labels (4 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => minWeight + t * weightRange);

  // X-axis week labels — show every other label if many weeks
  const weekLabels = Array.from({ length: weeks }, (_, i) => i + 1);
  const skipFactor = weeks > 8 ? 2 : 1;

  return (
    <div data-testid="progression-chart" className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Projected Progression</h3>

      <svg
        width="100%"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Projected progression chart"
      >
        {/* Y-axis ticks and grid lines */}
        {yTicks.map((tick, i) => {
          const y = yScale(tick);
          return (
            <g key={i}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={SVG_WIDTH - PADDING.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="#6b7280"
              >
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {weekLabels.map(week => {
          if ((week - 1) % skipFactor !== 0 && week !== weeks) return null;
          return (
            <text
              key={week}
              x={xScale(week)}
              y={SVG_HEIGHT - PADDING.bottom + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#6b7280"
            >
              {`W${week}`}
            </text>
          );
        })}

        {/* Axes */}
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={PADDING.top + chartHeight}
          stroke="#d1d5db"
          strokeWidth={1}
        />
        <line
          x1={PADDING.left}
          y1={PADDING.top + chartHeight}
          x2={SVG_WIDTH - PADDING.right}
          y2={PADDING.top + chartHeight}
          stroke="#d1d5db"
          strokeWidth={1}
        />

        {/* Exercise lines */}
        {allDataPoints.map((points, idx) => {
          const color = LINE_COLORS[idx % LINE_COLORS.length];
          const polylinePoints = points
            .map(p => `${xScale(p.week)},${yScale(p.weight)}`)
            .join(' ');

          const lastPt = points[points.length - 1];

          return (
            <g key={exercises[idx].name} data-exercise={exercises[idx].name}>
              <polyline
                points={polylinePoints}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Start dot */}
              <circle
                cx={xScale(points[0].week)}
                cy={yScale(points[0].weight)}
                r={3}
                fill={color}
              />
              {/* End dot */}
              <circle
                cx={xScale(lastPt.week)}
                cy={yScale(lastPt.weight)}
                r={3}
                fill={color}
              />
              {/* End weight label */}
              <text
                x={xScale(lastPt.week) + 5}
                y={yScale(lastPt.weight) + 4}
                fontSize={10}
                fill={color}
              >
                {Math.round(lastPt.weight)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {exercises.map((ex, idx) => {
          const color = LINE_COLORS[idx % LINE_COLORS.length];
          const finalWeight = ex.startWeight + (weeks - 1) * ex.weeklyIncrease;
          return (
            <div key={ex.name} className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-0.5 rounded"
                style={{ backgroundColor: color, height: '2px' }}
              />
              <span className="text-gray-700 font-medium">{ex.name}</span>
              <span className="text-gray-500">
                {ex.startWeight} → {Math.round(finalWeight)} lbs
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressionChart;
