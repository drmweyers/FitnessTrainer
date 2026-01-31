'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Heart, Target, Phone, Plus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Textarea } from '@/components/shared/Textarea';
import { Client, CreateClientData, FitnessLevel } from '@/types/client';

interface ClientFormProps {
  client?: Client; // For editing existing client
  onSubmit: (data: CreateClientData) => Promise<void>;
  onCancel: () => void;
}

interface FormData extends CreateClientData {
  // Additional form-specific fields
}

const fitnessLevels = [
  { value: FitnessLevel.BEGINNER, label: 'Beginner' },
  { value: FitnessLevel.INTERMEDIATE, label: 'Intermediate' },
  { value: FitnessLevel.ADVANCED, label: 'Advanced' },
];

const commonMedicalConditions = [
  'Diabetes',
  'High Blood Pressure',
  'Heart Disease',
  'Asthma',
  'Arthritis',
  'Back Pain',
  'Knee Problems',
  'Shoulder Issues',
];

const commonAllergies = [
  'Peanuts',
  'Tree Nuts',
  'Shellfish',
  'Dairy',
  'Eggs',
  'Soy',
  'Gluten',
  'Latex',
];

export default function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    fitnessLevel: FitnessLevel.BEGINNER,
    goals: {
      primaryGoal: '',
      targetWeight: undefined,
      targetBodyFat: undefined,
      timeframe: '',
      additionalNotes: '',
    },
    preferences: {
      workoutDays: [],
      sessionDuration: 60,
      equipmentAccess: [],
      specialRequests: '',
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    medicalConditions: [],
    medications: [],
    allergies: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('basic');

  // Custom input states for adding items to arrays
  const [newMedicalCondition, setNewMedicalCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newEquipment, setNewEquipment] = useState('');

  useEffect(() => {
    if (client) {
      setFormData({
        email: client.email || '',
        firstName: client.userProfile?.bio?.split(' ')[0] || '',
        lastName: client.userProfile?.bio?.split(' ')[1] || '',
        fitnessLevel: client.clientProfile?.fitnessLevel || FitnessLevel.BEGINNER,
        goals: client.clientProfile?.goals || {
          primaryGoal: '',
          additionalNotes: '',
        },
        preferences: client.clientProfile?.preferences || {
          workoutDays: [],
          sessionDuration: 60,
          equipmentAccess: [],
          specialRequests: '',
        },
        emergencyContact: client.clientProfile?.emergencyContact || {
          name: '',
          phone: '',
          relationship: '',
        },
        medicalConditions: client.clientProfile?.medicalConditions || [],
        medications: client.clientProfile?.medications || [],
        allergies: client.clientProfile?.allergies || [],
      });
    }
  }, [client]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (parent: keyof FormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent] as any,
        [field]: value,
      },
    }));
  };

  const handleArrayAdd = (field: keyof FormData, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()],
      }));
    }
  };

  const handleArrayRemove = (field: keyof FormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const handleWorkoutDayToggle = (day: string) => {
    const currentDays = formData.preferences?.workoutDays || [];
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    handleNestedChange('preferences', 'workoutDays', updatedDays);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.email) {
        throw new Error('Email is required');
      }

      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'health', label: 'Health', icon: Heart },
    { id: 'emergency', label: 'Emergency', icon: Phone },
  ];

  const workoutDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    currentTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            {currentTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Email Address *"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="client@example.com"
                    required
                  />
                  <div></div>
                  <Input
                    label="First Name"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                  />
                  <Input
                    label="Last Name"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fitness Level
                  </label>
                  <select
                    value={formData.fitnessLevel}
                    onChange={(e) => handleInputChange('fitnessLevel', e.target.value as FitnessLevel)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {fitnessLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workout Days
                  </label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {workoutDays.map((day) => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.preferences?.workoutDays?.includes(day) || false}
                          onChange={() => handleWorkoutDayToggle(day)}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{day.substr(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Duration (minutes)
                    </label>
                    <select
                      value={formData.preferences?.sessionDuration || 60}
                      onChange={(e) => handleNestedChange('preferences', 'sessionDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'goals' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Fitness Goal</label>
                  <Textarea
                    value={formData.goals?.primaryGoal || ''}
                    onChange={(e) => handleNestedChange('goals', 'primaryGoal', e.target.value)}
                    placeholder="Describe the client's main fitness objective..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Target Weight (lbs)"
                    type="number"
                    value={formData.goals?.targetWeight || ''}
                    onChange={(e) => handleNestedChange('goals', 'targetWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="150"
                  />
                  <Input
                    label="Target Body Fat %"
                    type="number"
                    step="0.1"
                    value={formData.goals?.targetBodyFat || ''}
                    onChange={(e) => handleNestedChange('goals', 'targetBodyFat', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="15.0"
                  />
                </div>

                <Input
                  label="Timeframe"
                  value={formData.goals?.timeframe || ''}
                  onChange={(e) => handleNestedChange('goals', 'timeframe', e.target.value)}
                  placeholder="6 months, 1 year, etc."
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                  <Textarea
                    value={formData.goals?.additionalNotes || ''}
                    onChange={(e) => handleNestedChange('goals', 'additionalNotes', e.target.value)}
                    placeholder="Any additional information about goals..."
                    rows={3}
                  />
                </div>

                {/* Equipment Access */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Equipment
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={newEquipment}
                      onChange={(e) => setNewEquipment(e.target.value)}
                      placeholder="Add equipment..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (newEquipment.trim()) {
                          handleArrayAdd('preferences', newEquipment);
                          setNewEquipment('');
                        }
                      }}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.preferences?.equipmentAccess || []).map((equipment, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {equipment}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.preferences?.equipmentAccess.filter((_, i) => i !== index) || [];
                            handleNestedChange('preferences', 'equipmentAccess', updated);
                          }}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'health' && (
              <div className="space-y-6">
                {/* Medical Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Conditions
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {commonMedicalConditions.map((condition) => (
                      <label key={condition} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.medicalConditions?.includes(condition) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleArrayAdd('medicalConditions', condition);
                            } else {
                              const index = formData.medicalConditions?.indexOf(condition) || -1;
                              if (index > -1) {
                                handleArrayRemove('medicalConditions', index);
                              }
                            }
                          }}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{condition}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={newMedicalCondition}
                      onChange={(e) => setNewMedicalCondition(e.target.value)}
                      placeholder="Add custom condition..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        handleArrayAdd('medicalConditions', newMedicalCondition);
                        setNewMedicalCondition('');
                      }}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.medicalConditions || []).map((condition, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                      >
                        {condition}
                        <button
                          type="button"
                          onClick={() => handleArrayRemove('medicalConditions', index)}
                          className="ml-1 text-red-600 hover:text-red-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Medications
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={newMedication}
                      onChange={(e) => setNewMedication(e.target.value)}
                      placeholder="Add medication..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        handleArrayAdd('medications', newMedication);
                        setNewMedication('');
                      }}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.medications || []).map((medication, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {medication}
                        <button
                          type="button"
                          onClick={() => handleArrayRemove('medications', index)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergies
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {commonAllergies.map((allergy) => (
                      <label key={allergy} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.allergies?.includes(allergy) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleArrayAdd('allergies', allergy);
                            } else {
                              const index = formData.allergies?.indexOf(allergy) || -1;
                              if (index > -1) {
                                handleArrayRemove('allergies', index);
                              }
                            }
                          }}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{allergy}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      placeholder="Add custom allergy..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        handleArrayAdd('allergies', newAllergy);
                        setNewAllergy('');
                      }}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.allergies || []).map((allergy, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                      >
                        {allergy}
                        <button
                          type="button"
                          onClick={() => handleArrayRemove('allergies', index)}
                          className="ml-1 text-yellow-600 hover:text-yellow-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'emergency' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Contact Name"
                    value={formData.emergencyContact?.name || ''}
                    onChange={(e) => handleNestedChange('emergencyContact', 'name', e.target.value)}
                    placeholder="John Smith"
                  />
                  <Input
                    label="Relationship"
                    value={formData.emergencyContact?.relationship || ''}
                    onChange={(e) => handleNestedChange('emergencyContact', 'relationship', e.target.value)}
                    placeholder="Spouse, Parent, etc."
                  />
                </div>
                
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.emergencyContact?.phone || ''}
                  onChange={(e) => handleNestedChange('emergencyContact', 'phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests or Notes</label>
                  <Textarea
                    value={formData.preferences?.specialRequests || ''}
                    onChange={(e) => handleNestedChange('preferences', 'specialRequests', e.target.value)}
                    placeholder="Any special accommodations, preferences, or notes..."
                    rows={4}
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={loading}
            disabled={loading}
          >
            {client ? 'Update Client' : 'Create Client'}
          </Button>
        </div>
      </div>
    </div>
  );
}