'use client';

import React, { useState, useEffect } from 'react';
import { Lock, ArrowUpRight, BarChart2, Activity, FileDown } from 'lucide-react';
import { BodyMeasurement } from '@/types/analytics';
import { analyticsApi } from '@/lib/api/analytics';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import MeasurementTracker from '@/components/features/Analytics/MeasurementTracker';
import ProgressChart from '@/components/features/Analytics/ProgressChart';
import MultiLineChart from '@/components/features/Analytics/MultiLineChart';
import BodyCompositionChart from '@/components/features/Analytics/BodyCompositionChart';

import PerformanceTab from '@/components/features/Analytics/PerformanceTab';
import TrainingLoadTab from '@/components/features/Analytics/TrainingLoadTab';
import GoalsTab from '@/components/features/Analytics/GoalsTab';
import ReportModal from '@/components/features/Analytics/ReportModal';
import ClientSelector from '@/components/features/Analytics/ClientSelector';
import TrainerAnalyticsDashboard from '@/components/features/Analytics/TrainerAnalyticsDashboard';
import { useToast, ToastContainer } from '@/components/shared/Toast';
import { useTier } from '@/hooks/useTier';

/**
 * Upgrade wall shown to Starter-tier users who land on the Analytics page.
 * Rendered as a full-viewport-height centered card so it replaces all page content.
 */
function AnalyticsLockedView() {
  return (
    <div
      data-testid="analytics-locked-view"
      className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
    >
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-10 text-center">
        {/* Lock icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-orange-50 flex items-center justify-center">
          <Lock className="h-8 w-8 text-orange-500" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Analytics requires Professional or Enterprise
        </h2>
        <p className="text-gray-500 mb-8">
          Upgrade your plan to unlock powerful insights that help you and your clients train smarter.
        </p>

        {/* Feature highlights */}
        <ul className="space-y-3 mb-8 text-left">
          <li className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-800">ACWR &amp; Training Load</span>
              <p className="text-sm text-gray-500">Monitor acute:chronic workload ratio to prevent overtraining and peak at the right time.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <BarChart2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-800">Performance &amp; Body Composition Charts</span>
              <p className="text-sm text-gray-500">Track weight, body fat, muscle mass, and personal records across configurable time ranges.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <FileDown className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-800">CSV &amp; PDF Reports</span>
              <p className="text-sm text-gray-500">Export client progress reports in one click to share with athletes or keep for your records.</p>
            </div>
          </li>
        </ul>

        {/* Upgrade CTA */}
        <a
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Upgrade to Professional
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<BodyMeasurement | null>(null);
  const { success, error: showError, toasts, removeToast } = useToast();
  const { isEnterprise } = useTier();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '3m' | '6m' | '1y'>('3m');
  const [activeView, setActiveView] = useState<'overview' | 'charts' | 'history' | 'performance' | 'training-load' | 'goals'>('overview');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Load measurements when user or selectedClientId changes
  const loadMeasurements = async () => {
    try {
      setIsLoading(true);
      const data = await analyticsApi.getBodyMeasurements(undefined, selectedClientId || undefined);
      setMeasurements(data);
    } catch (error) {
      console.error('Failed to load measurements:', error);
      showError('Failed to load measurements', 'Please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    // Trainers without a selected client have no personal measurements to load —
    // their Overview tab uses TrainerAnalyticsDashboard which fetches its own data.
    if (user.role === 'trainer' && !selectedClientId) {
      setIsLoading(false);
      return;
    }
    loadMeasurements();
  }, [user?.id, user?.role, selectedClientId]);

  // Show loading while auth is initializing or user not yet available
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const handleSaveMeasurement = async (measurement: BodyMeasurement) => {
    try {
      if (selectedMeasurement?.id) {
        await analyticsApi.updateBodyMeasurement(selectedMeasurement.id, measurement);
        success('Measurement Updated', 'Your measurement has been updated successfully');
      } else {
        await analyticsApi.saveBodyMeasurement(measurement);
        success('Measurement Saved', 'Your measurement has been saved successfully');
      }

      await loadMeasurements();
      setIsTrackerOpen(false);
      setSelectedMeasurement(null);
    } catch (error) {
      console.error('Failed to save measurement:', error);
      showError('Save Failed', 'Failed to save measurement. Please try again.');
    }
  };

  const handleEditMeasurement = (measurement: BodyMeasurement) => {
    setSelectedMeasurement(measurement);
    setIsTrackerOpen(true);
  };

  const handleDeleteMeasurement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this measurement?')) return;

    try {
      await analyticsApi.deleteBodyMeasurement(id);
      await loadMeasurements();
      success('Measurement Deleted', 'Your measurement has been deleted successfully');
    } catch (error) {
      console.error('Failed to delete measurement:', error);
      showError('Delete Failed', 'Failed to delete measurement. Please try again.');
    }
  };


  const openNewMeasurementTracker = () => {
    setSelectedMeasurement(null);
    setIsTrackerOpen(true);
  };

  /**
   * Trigger a CSV download from the analytics export endpoint.
   * Available for all authenticated users.
   */
  const handleExportCSV = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `/api/analytics/reports/export?format=csv&startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        showError('Export Failed', 'Could not generate CSV report. Please try again.');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evofit-report-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      success('Export Ready', 'Your CSV report is downloading.');
    } catch (err) {
      console.error('CSV export error:', err);
      showError('Export Failed', 'An unexpected error occurred.');
    }
  };

  /**
   * Trigger an Excel download from the analytics export endpoint.
   * Available for Enterprise tier users only.
   */
  const handleExportExcel = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `/api/analytics/reports/export?format=excel&startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        showError('Export Failed', 'Could not generate Excel report. Please try again.');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evofit-report-${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      success('Export Ready', 'Your Excel report is downloading.');
    } catch (err) {
      console.error('Excel export error:', err);
      showError('Export Failed', 'An unexpected error occurred.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMeasurementSummary = (measurement: BodyMeasurement) => {
    const parts = [];
    if (measurement.weight) parts.push(`${measurement.weight} kg`);
    if (measurement.bodyFatPercentage) parts.push(`${measurement.bodyFatPercentage}% BF`);
    if (measurement.muscleMass) parts.push(`${measurement.muscleMass} kg muscle`);
    return parts.join(' • ');
  };

  // Prepare chart data
  const getWeightChartData = () => {
    return measurements
      .filter(m => m.weight)
      .map(m => ({
        date: m.measurementDate,
        value: m.weight!,
        label: m.notes || undefined,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getBodyFatChartData = () => {
    return measurements
      .filter(m => m.bodyFatPercentage)
      .map(m => ({
        date: m.measurementDate,
        value: m.bodyFatPercentage!,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getMultiLineChartData = () => {
    return [
      {
        name: 'Weight',
        color: '#3B82F6',
        data: measurements
          .filter(m => m.weight)
          .map(m => ({
            date: m.measurementDate,
            value: m.weight!,
          })),
      },
      {
        name: 'Body Fat %',
        color: '#F59E0B',
        data: measurements
          .filter(m => m.bodyFatPercentage)
          .map(m => ({
            date: m.measurementDate,
            value: m.bodyFatPercentage!,
          })),
      },
      {
        name: 'Muscle Mass',
        color: '#10B981',
        data: measurements
          .filter(m => m.muscleMass)
          .map(m => ({
            date: m.measurementDate,
            value: m.muscleMass!,
          })),
      },
    ].filter(dataset => dataset.data.length > 0);
  };

  const getBodyCompositionData = () => {
    return measurements
      .filter(m => m.weight)
      .map(m => ({
        date: m.measurementDate,
        weight: m.weight!,
        bodyFat: m.bodyFatPercentage,
        muscleMass: m.muscleMass,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Tier gate: Analytics is a Pro+ feature for trainers. Starter trainers see AnalyticsLockedView.
  // Clients always bypass the gate — their trainer owns the subscription tier, not them.
  const analyticsContent = (
    <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {user?.role === 'trainer' && selectedClientId
                    ? 'Client Analytics'
                    : user?.role === 'trainer'
                    ? 'Trainer Analytics'
                    : 'Progress Analytics'}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {user?.role === 'trainer' && selectedClientId
                    ? 'Viewing analytics for selected client'
                    : user?.role === 'trainer'
                    ? 'Your client roster and performance overview — select a client to drill into their analytics'
                    : 'Track your body measurements and monitor progress over time'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleExportCSV}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  data-testid="export-csv-btn"
                >
                  Export CSV
                </button>
                {isEnterprise && (
                  <button
                    onClick={handleExportExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                    data-testid="export-excel-btn"
                  >
                    Export Excel
                  </button>
                )}
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Generate Report
                </button>
                {(user?.role !== 'trainer' || selectedClientId) && (
                  <button
                    onClick={openNewMeasurementTracker}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Record New Measurement
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-t border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {[
                  { key: 'overview', label: 'Overview', icon: '📊' },
                  { key: 'performance', label: 'Performance', icon: '💪' },
                  { key: 'training-load', label: 'Training Load', icon: '⚡' },
                  { key: 'goals', label: 'Goals', icon: '🎯' },
                  { key: 'charts', label: 'Charts & Trends', icon: '📈' },
                  { key: 'history', label: 'History', icon: '📋' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveView(tab.key as any)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeView === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Trainer with no client selected */}
          {user?.role === 'trainer' && !selectedClientId && (
            activeView === 'overview' ? (
              <TrainerAnalyticsDashboard onClientSelect={setSelectedClientId} />
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Client</h3>
                <p className="text-gray-500 mb-4">Choose a client from your roster to view their analytics data.</p>
                <button
                  onClick={() => setActiveView('overview')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                  Go to Overview
                </button>
              </div>
            )
          )}

          {/* Trainer with a client selected → show client selector + client analytics */}
          {user?.role === 'trainer' && selectedClientId && (
            <div className="mb-6">
              <ClientSelector
                selectedClientId={selectedClientId}
                onClientChange={setSelectedClientId}
              />
            </div>
          )}

          {/* Client analytics tabs: visible to clients always, and to trainers only when a client is selected */}
          {(user?.role !== 'trainer' || selectedClientId) && (isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : measurements.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No measurements yet</h3>
              <p className="text-gray-500 mb-4">Start tracking your progress by recording your first measurement.</p>
              <button
                onClick={openNewMeasurementTracker}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Measurements</h3>
                  <p className="text-2xl font-bold text-gray-900">{measurements.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Current Weight</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {measurements[0]?.weight ? `${measurements[0].weight} kg` : 'N/A'}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Body Fat</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {measurements[0]?.bodyFatPercentage ? `${measurements[0].bodyFatPercentage}%` : 'N/A'}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Muscle Mass</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {measurements[0]?.muscleMass ? `${measurements[0].muscleMass} kg` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* View Content */}
              {activeView === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Overview Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ProgressChart
                      data={getWeightChartData()}
                      title="Weight Progress"
                      unit="kg"
                      height={300}
                      color="#3B82F6"
                      timeRange={timeRange}
                      onTimeRangeChange={setTimeRange}
                    />
                    <ProgressChart
                      data={getBodyFatChartData()}
                      title="Body Fat Progress"
                      unit="%"
                      height={300}
                      color="#F59E0B"
                      timeRange={timeRange}
                      onTimeRangeChange={setTimeRange}
                    />
                  </div>

                  {/* Recent Measurements */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">Recent Measurements</h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {measurements.slice(0, 5).map((measurement, index) => (
                        <div key={measurement.id || index} className="px-6 py-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatDate(measurement.measurementDate)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {getMeasurementSummary(measurement) || 'Body measurements recorded'}
                                  </p>
                                </div>
                              </div>
                              {measurement.notes && (
                                <p className="mt-2 text-sm text-gray-600">{measurement.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditMeasurement(measurement)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {measurements.length > 5 && (
                        <div className="px-6 py-4 text-center">
                          <button
                            onClick={() => setActiveView('history')}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View All {measurements.length} Measurements →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeView === 'charts' && (
                <div className="space-y-6">
                  {/* Multi-Line Comparison Chart */}
                  <MultiLineChart
                    data={getMultiLineChartData()}
                    title="Progress Comparison"
                    height={400}
                    yAxisLabel="Value"
                  />

                  {/* Body Composition Analysis */}
                  <BodyCompositionChart
                    data={getBodyCompositionData()}
                    height={400}
                  />

                  {/* Individual Progress Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ProgressChart
                      data={getWeightChartData()}
                      title="Weight Progress"
                      unit="kg"
                      height={350}
                      color="#3B82F6"
                      timeRange={timeRange}
                      onTimeRangeChange={setTimeRange}
                      showTrendLine={true}
                    />
                    <ProgressChart
                      data={getBodyFatChartData()}
                      title="Body Fat Progress"
                      unit="%"
                      height={350}
                      color="#F59E0B"
                      timeRange={timeRange}
                      onTimeRangeChange={setTimeRange}
                      showTrendLine={true}
                    />
                  </div>
                </div>
              )}

              {activeView === 'performance' && (
                <PerformanceTab clientId={selectedClientId} />
              )}

              {activeView === 'training-load' && (
                <TrainingLoadTab clientId={selectedClientId} />
              )}

              {activeView === 'goals' && (
                <GoalsTab />
              )}

              {activeView === 'history' && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Complete Measurement History</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {measurements.length} measurements recorded
                    </p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {measurements.map((measurement, index) => (
                      <div key={measurement.id || index} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDate(measurement.measurementDate)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {getMeasurementSummary(measurement) || 'Body measurements recorded'}
                                </p>
                              </div>
                            </div>
                            {measurement.notes && (
                              <p className="mt-2 text-sm text-gray-600">{measurement.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditMeasurement(measurement)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => measurement.id && handleDeleteMeasurement(measurement.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Measurement Tracker Modal */}
        <MeasurementTracker
          onSave={handleSaveMeasurement}
          onCancel={() => {
            setIsTrackerOpen(false);
            setSelectedMeasurement(null);
          }}
          initialData={selectedMeasurement || undefined}
          isOpen={isTrackerOpen}
        />

        {/* Report Modal */}
        <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
  );

  return user?.role === 'client' ? analyticsContent : (
    <FeatureGate minTier="professional" fallback={<AnalyticsLockedView />}>
      {analyticsContent}
    </FeatureGate>
  );
}
