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
              <div className="flex space-x-3 pt-2">
                <Button variant="outline" onClick={() => setReport(null)} className="flex-1">
                  Generate Another
                </Button>
                <Button onClick={() => { onClose(); setReport(null); }} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
