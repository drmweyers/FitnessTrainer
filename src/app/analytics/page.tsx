'use client';

import React, { useState, useEffect } from 'react';
import { BodyMeasurement } from '@/types/analytics';
import { analyticsApi } from '@/lib/api/analytics';
import MeasurementTracker from '@/components/features/Analytics/MeasurementTracker';
import ProgressChart from '@/components/features/Analytics/ProgressChart';
import MultiLineChart from '@/components/features/Analytics/MultiLineChart';
import BodyCompositionChart from '@/components/features/Analytics/BodyCompositionChart';
import Toast from '@/components/shared/Toast';

export default function AnalyticsPage() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<BodyMeasurement | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '3m' | '6m' | '1y'>('3m');
  const [activeView, setActiveView] = useState<'overview' | 'charts' | 'history'>('overview');

  // Mock user ID - in real app this would come from authentication context
  const userId = 'mock-user-id';

  useEffect(() => {
    loadMeasurements();
  }, []);

  const loadMeasurements = async () => {
    try {
      setIsLoading(true);
      const data = await analyticsApi.getBodyMeasurements(userId);
      setMeasurements(data);
    } catch (error) {
      console.error('Failed to load measurements:', error);
      showToast('Failed to load measurements', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMeasurement = async (measurement: BodyMeasurement) => {
    try {
      if (selectedMeasurement?.id) {
        await analyticsApi.updateBodyMeasurement(selectedMeasurement.id, measurement);
        showToast('Measurement updated successfully!', 'success');
      } else {
        await analyticsApi.saveBodyMeasurement(measurement);
        showToast('Measurement saved successfully!', 'success');
      }
      
      await loadMeasurements();
      setIsTrackerOpen(false);
      setSelectedMeasurement(null);
    } catch (error) {
      console.error('Failed to save measurement:', error);
      showToast('Failed to save measurement', 'error');
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
      showToast('Measurement deleted successfully!', 'success');
    } catch (error) {
      console.error('Failed to delete measurement:', error);
      showToast('Failed to delete measurement', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const openNewMeasurementTracker = () => {
    setSelectedMeasurement(null);
    setIsTrackerOpen(true);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Progress Analytics</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track your body measurements and monitor your progress over time
              </p>
            </div>
            <button
              onClick={openNewMeasurementTracker}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Record New Measurement
            </button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'charts', label: 'Charts & Trends', icon: '📈' },
                { key: 'history', label: 'History', icon: '📋' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveView(tab.key as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
        {isLoading ? (
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
        )}
      </div>

      {/* Measurement Tracker Modal */}
      <MeasurementTracker
        userId={userId}
        onSave={handleSaveMeasurement}
        onCancel={() => {
          setIsTrackerOpen(false);
          setSelectedMeasurement(null);
        }}
        initialData={selectedMeasurement || undefined}
        isOpen={isTrackerOpen}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}