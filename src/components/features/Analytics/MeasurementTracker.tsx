'use client';

import React, { useState, useRef } from 'react';
import { BodyMeasurement, MeasurementSession, MEASUREMENT_TYPES } from '@/types/analytics';
import PhotoUpload from './PhotoUpload';

interface MeasurementTrackerProps {
  userId: string;
  onSave: (measurement: BodyMeasurement) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<BodyMeasurement>;
  isOpen: boolean;
}

interface MeasurementField {
  key: keyof BodyMeasurement['measurements'];
  label: string;
  unit: string;
  placeholder: string;
}

const MEASUREMENT_FIELDS: MeasurementField[] = [
  { key: 'chest', label: 'Chest', unit: 'cm', placeholder: 'e.g., 102' },
  { key: 'waist', label: 'Waist', unit: 'cm', placeholder: 'e.g., 85' },
  { key: 'hips', label: 'Hips', unit: 'cm', placeholder: 'e.g., 95' },
  { key: 'biceps', label: 'Biceps', unit: 'cm', placeholder: 'e.g., 35' },
  { key: 'thighs', label: 'Thighs', unit: 'cm', placeholder: 'e.g., 60' },
  { key: 'neck', label: 'Neck', unit: 'cm', placeholder: 'e.g., 38' },
  { key: 'shoulders', label: 'Shoulders', unit: 'cm', placeholder: 'e.g., 115' },
  { key: 'forearms', label: 'Forearms', unit: 'cm', placeholder: 'e.g., 28' },
  { key: 'calves', label: 'Calves', unit: 'cm', placeholder: 'e.g., 38' },
];

export default function MeasurementTracker({
  userId,
  onSave,
  onCancel,
  initialData,
  isOpen
}: MeasurementTrackerProps) {
  const [formData, setFormData] = useState<Partial<BodyMeasurement>>({
    userId,
    measurementDate: new Date().toISOString().split('T')[0],
    weight: undefined,
    bodyFatPercentage: undefined,
    muscleMass: undefined,
    measurements: {},
    notes: '',
    photos: [],
    ...initialData,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'measurements' | 'photos'>('basic');

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.measurementDate) {
      newErrors.measurementDate = 'Measurement date is required';
    }

    // At least one measurement should be provided
    const hasBasicMeasurement = formData.weight || formData.bodyFatPercentage || formData.muscleMass;
    const hasBodyMeasurement = formData.measurements && Object.values(formData.measurements).some(val => val && val > 0);
    
    if (!hasBasicMeasurement && !hasBodyMeasurement) {
      newErrors.general = 'Please provide at least one measurement';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave(formData as BodyMeasurement);
    } catch (error) {
      setErrors({ general: 'Failed to save measurement. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof BodyMeasurement, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleMeasurementChange = (field: keyof BodyMeasurement['measurements'], value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setFormData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [field]: numValue,
      },
    }));
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData?.id ? 'Update Measurements' : 'Record New Measurements'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Track your physical progress over time
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Tabs */}
          <div className="px-6 py-3 border-b border-gray-200">
            <div className="flex space-x-6">
              {[
                { key: 'basic', label: 'Basic Info' },
                { key: 'measurements', label: 'Body Measurements' },
                { key: 'photos', label: 'Progress Photos' },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* General Error */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Measurement Date *
                  </label>
                  <input
                    type="date"
                    value={formData.measurementDate || ''}
                    onChange={(e) => handleInputChange('measurementDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.measurementDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.measurementDate && (
                    <p className="text-sm text-red-600 mt-1">{errors.measurementDate}</p>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g., 75.5"
                    value={formData.weight || ''}
                    onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Body Fat Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body Fat Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    placeholder="e.g., 15.2"
                    value={formData.bodyFatPercentage || ''}
                    onChange={(e) => handleInputChange('bodyFatPercentage', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Muscle Mass */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Muscle Mass (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g., 45.8"
                    value={formData.muscleMass || ''}
                    onChange={(e) => handleInputChange('muscleMass', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any additional notes about your measurements..."
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Body Measurements Tab */}
            {activeTab === 'measurements' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Enter your body measurements in centimeters. You can measure yourself or have someone help you.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MEASUREMENT_FIELDS.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} ({field.unit})
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder={field.placeholder}
                        value={formData.measurements?.[field.key] || ''}
                        onChange={(e) => handleMeasurementChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Photos Tab */}
            {activeTab === 'photos' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progress Photos (Optional)
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    Take photos in good lighting, wearing minimal clothing for the best progress tracking.
                  </p>
                  
                  <PhotoUpload
                    onUpload={(files) => {
                      // Convert files to base64 for preview
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({
                            ...prev,
                            photos: [...(prev.photos || []), reader.result as string]
                          }));
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                    maxFiles={4}
                    existingPhotos={formData.photos || []}
                    onRemove={(photoUrl) => {
                      setFormData(prev => ({
                        ...prev,
                        photos: prev.photos?.filter(p => p !== photoUrl)
                      }));
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : (initialData?.id ? 'Update Measurement' : 'Save Measurement')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}