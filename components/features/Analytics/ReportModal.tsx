'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportData {
  id: string;
  generatedAt: string;
  period: { startDate: string; endDate: string };
  summary: {
    totalWorkouts: number;
    completedWorkouts: number;
    completionRate: number;
    totalDurationMinutes: number;
    totalVolume: number;
    averageRpe: number;
  };
  workouts: Array<{
    date: string;
    status: string;
    duration: number | null;
    volume: number | null;
    sets: number | null;
    completedSets: number | null;
  }>;
  measurements: Array<{
    weight: number | null;
    bodyFat: number | null;
    muscleMass: number | null;
    date: string;
  }>;
  goals: Array<{
    type: string;
    specific: string | null;
    target: number | null;
    targetDate: string | null;
    latestProgress: { value: number; percentage: number } | null;
  }>;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/analytics/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ startDate, endDate }),
      });
      const result = await res.json();
      if (result.success) {
        setReport(result.data);
      } else {
        setError(result.error || 'Failed to generate report');
      }
    } catch {
      setError('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const downloadCSV = () => {
    if (!report) return;

    const csvRows: string[] = [];

    // Header
    csvRows.push('EvoFit Trainer - Progress Report');
    csvRows.push(`Period,${report.period.startDate} to ${report.period.endDate}`);
    csvRows.push(`Generated,${new Date(report.generatedAt).toLocaleString()}`);
    csvRows.push('');

    // Summary
    csvRows.push('WORKOUT SUMMARY');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Workouts,${report.summary.totalWorkouts}`);
    csvRows.push(`Completed Workouts,${report.summary.completedWorkouts}`);
    csvRows.push(`Completion Rate,${report.summary.completionRate}%`);
    csvRows.push(`Total Duration (minutes),${report.summary.totalDurationMinutes}`);
    csvRows.push(`Total Volume (kg),${report.summary.totalVolume}`);
    csvRows.push(`Average RPE,${report.summary.averageRpe}`);
    csvRows.push('');

    // Measurements
    if (report.measurements.length > 0) {
      csvRows.push('BODY MEASUREMENTS');
      csvRows.push('Date,Weight (kg),Body Fat (%),Muscle Mass (kg)');
      report.measurements.forEach(m => {
        csvRows.push(`${m.date},${m.weight || ''},${m.bodyFat || ''},${m.muscleMass || ''}`);
      });
      csvRows.push('');
    }

    // Goals
    if (report.goals.length > 0) {
      csvRows.push('ACTIVE GOALS');
      csvRows.push('Type,Specific,Target,Target Date,Progress (%)');
      report.goals.forEach(g => {
        csvRows.push(
          `${g.type},${g.specific || ''},${g.target || ''},${g.targetDate || ''},${g.latestProgress?.percentage || ''}`
        );
      });
      csvRows.push('');
    }

    // Workouts
    if (report.workouts.length > 0) {
      csvRows.push('WORKOUT HISTORY');
      csvRows.push('Date,Status,Duration (min),Volume (kg),Sets,Completed Sets');
      report.workouts.forEach(w => {
        csvRows.push(
          `${w.date},${w.status},${w.duration || ''},${w.volume || ''},${w.sets || ''},${w.completedSets || ''}`
        );
      });
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `evofittrainer-report-${report.period.startDate}-to-${report.period.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Progress Report</h2>
          <button
            onClick={() => { onClose(); setReport(null); }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {!report ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportStart">Start Date</Label>
                  <Input
                    id="reportStart"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="reportEnd">End Date</Label>
                  <Input
                    id="reportEnd"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <Button onClick={generateReport} disabled={isGenerating} className="w-full">
                {isGenerating ? 'Generating Report...' : 'Generate Report'}
              </Button>
            </>
          ) : (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="text-center pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-500">
                  {formatDate(report.period.startDate)} - {formatDate(report.period.endDate)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Generated {new Date(report.generatedAt).toLocaleString()}
                </p>
              </div>

              {/* Summary Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Workout Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{report.summary.completedWorkouts}</p>
                      <p className="text-xs text-gray-500">Workouts</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{report.summary.completionRate}%</p>
                      <p className="text-xs text-gray-500">Completion</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {report.summary.totalDurationMinutes > 0
                          ? `${Math.round(report.summary.totalDurationMinutes / 60)}h`
                          : '0h'}
                      </p>
                      <p className="text-xs text-gray-500">Total Time</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {report.summary.totalVolume > 0 ? `${Math.round(report.summary.totalVolume).toLocaleString()} kg` : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">Total Volume</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {report.summary.averageRpe > 0 ? report.summary.averageRpe : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">Avg RPE</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Body Measurements */}
              {report.measurements.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Body Measurements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.measurements.map((m, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1">
                          <span className="text-gray-500">{formatDate(m.date)}</span>
                          <div className="flex space-x-4">
                            {m.weight && <span>{m.weight} kg</span>}
                            {m.bodyFat && <span>{m.bodyFat}% BF</span>}
                            {m.muscleMass && <span>{m.muscleMass} kg muscle</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Goals */}
              {report.goals.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Active Goals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {report.goals.map((g, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 capitalize">{g.type.replace(/_/g, ' ')}</p>
                            {g.specific && <p className="text-xs text-gray-500">{g.specific}</p>}
                          </div>
                          {g.latestProgress ? (
                            <span className="text-sm font-medium text-blue-600">
                              {g.latestProgress.percentage}%
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No progress data</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col space-y-2 pt-2">
                <Button onClick={downloadCSV} variant="outline" className="w-full">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download as CSV
                </Button>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setReport(null)} className="flex-1">
                    Generate Another
                  </Button>
                  <Button onClick={() => { onClose(); setReport(null); }} className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
