'use client';

import React, { useState } from 'react';
import { useProgramBuilder } from './ProgramBuilderContext';
import { Target, Dumbbell, Plus, X, Clock } from 'lucide-react';

const programTypes = [
  { value: 'strength', label: 'Strength Training' },
  { value: 'hypertrophy', label: 'Muscle Building (Hypertrophy)' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'powerlifting', label: 'Powerlifting' },
  { value: 'olympic_weightlifting', label: 'Olympic Weightlifting' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'calisthenics', label: 'Calisthenics' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'flexibility', label: 'Flexibility & Mobility' },
  { value: 'rehabilitation', label: 'Rehabilitation' },
  { value: 'sports_specific', label: 'Sports Specific' },
  { value: 'general_fitness', label: 'General Fitness' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'hybrid', label: 'Hybrid' }
];

const difficultyLevels = [
  { value: 'beginner', label: 'Beginner', description: 'New to training or returning after a break' },
  { value: 'intermediate', label: 'Intermediate', description: '6-24 months of consistent training' },
  { value: 'advanced', label: 'Advanced', description: '2+ years of consistent training' }
];

const commonGoals = [
  'Build Strength',
  'Gain Muscle',
  'Lose Weight',
  'Improve Endurance',
  'Increase Power',
  'Enhance Athletic Performance',
  'Better Health',
  'Learn Proper Form',
  'Establish Routine',
  'Rehabilitation',
  'Competition Prep',
  'General Fitness'
];

const commonEquipment = [
  'Barbell',
  'Dumbbells',
  'Kettlebells',
  'Resistance Bands',
  'Pull-up Bar',
  'Bench',
  'Squat Rack',
  'Cable Machine',
  'Medicine Ball',
  'Jump Rope',
  'TRX/Suspension',
  'Foam Roller',
  'Bodyweight Only',
  'Full Gym Access'
];

interface ProgramFormProps {
  onNext: () => void
  onPrev: () => void
}

const ProgramForm: React.FC<ProgramFormProps> = ({ onNext, onPrev }) => {
  const { state, dispatch } = useProgramBuilder();
  const [newGoal, setNewGoal] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    programType?: string;
    difficultyLevel?: string;
  }>({});

  const handleBasicInfoChange = (field: string, value: any) => {
    dispatch({
      type: 'SET_BASIC_INFO',
      payload: { [field]: value }
    });
    // Clear error for this field when user types
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleGoal = (goal: string) => {
    const newGoals = state.goals.includes(goal)
      ? state.goals.filter(g => g !== goal)
      : [...state.goals, goal];
    handleBasicInfoChange('goals', newGoals);
  };

  const addGoal = () => {
    const trimmed = newGoal.trim();
    if (trimmed && !state.goals.includes(trimmed)) {
      handleBasicInfoChange('goals', [...state.goals, trimmed]);
      setNewGoal('');
    }
  };

  const handleGoalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addGoal();
    }
  };

  const toggleEquipment = (equipment: string) => {
    const newEquipment = state.equipmentNeeded.includes(equipment)
      ? state.equipmentNeeded.filter(e => e !== equipment)
      : [...state.equipmentNeeded, equipment];
    handleBasicInfoChange('equipmentNeeded', newEquipment);
  };

  const validateAndNext = () => {
    const newErrors: typeof errors = {};

    if (!state.name.trim()) {
      newErrors.name = 'Program name is required';
    }
    if (!state.programType) {
      newErrors.programType = 'Program type is required';
    }
    if (!state.difficultyLevel) {
      newErrors.difficultyLevel = 'Difficulty level is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Program Information</h2>
        <p className="text-gray-600 mt-2">
          Let's start by setting up the basic information for your training program.
        </p>
      </div>

      {/* Program Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Program Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={state.name}
          onChange={(e) => handleBasicInfoChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 12-Week Strength Builder"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={state.description}
          onChange={(e) => handleBasicInfoChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe what this program is designed to achieve..."
        />
      </div>

      {/* Program Type */}
      <div>
        <label htmlFor="programType" className="block text-sm font-medium text-gray-700 mb-1">
          Program Type <span className="text-red-500">*</span>
        </label>
        <select
          id="programType"
          value={state.programType}
          onChange={(e) => handleBasicInfoChange('programType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a program type</option>
          {programTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.programType && (
          <p className="mt-1 text-sm text-red-600" role="alert">{errors.programType}</p>
        )}
      </div>

      {/* Difficulty Level */}
      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" role="group" aria-label="Difficulty level selection">
            {difficultyLevels.map(level => (
              <label
                key={level.value}
                className={`cursor-pointer p-3 border-2 rounded-lg text-left transition-colors ${
                  state.difficultyLevel === level.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="difficultyLevel"
                    value={level.value}
                    checked={state.difficultyLevel === level.value}
                    onChange={(e) => handleBasicInfoChange('difficultyLevel', e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{level.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{level.description}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.difficultyLevel && (
            <p className="mt-1 text-sm text-red-600" role="alert">{errors.difficultyLevel}</p>
          )}
        </fieldset>
      </div>

      {/* Duration */}
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1">
          <Clock className="inline h-4 w-4 mr-1" />
          Program Duration (weeks) <span className="text-red-500">*</span>
        </span>
        <div className="flex items-center space-x-4">
          <label htmlFor="duration-range" className="sr-only">Program Duration</label>
          <input
            type="range"
            id="duration-range"
            min="1"
            max="52"
            value={state.durationWeeks}
            onChange={(e) => handleBasicInfoChange('durationWeeks', parseInt(e.target.value))}
            className="flex-1"
            aria-label="Program duration in weeks"
          />
          <div className="w-20">
            <label htmlFor="duration-number" className="sr-only">Duration in weeks</label>
            <input
              type="number"
              id="duration-number"
              min="1"
              max="52"
              value={state.durationWeeks}
              onChange={(e) => handleBasicInfoChange('durationWeeks', parseInt(e.target.value) || 1)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-center"
              aria-label="Program duration in weeks"
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {state.durationWeeks} week{state.durationWeeks !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Goals */}
      <div>
        <label htmlFor="goal-input" className="block text-sm font-medium text-gray-700 mb-2">
          <Target className="inline h-4 w-4 mr-1" />
          Program Goals
        </label>

        {/* Add custom goal input */}
        <div className="flex gap-2 mb-3">
          <input
            id="goal-input"
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={handleGoalKeyDown}
            placeholder="Add a goal..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addGoal}
            disabled={!newGoal.trim()}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Selected goals */}
        {state.goals.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3" role="list" aria-label="Selected goals">
            {state.goals.map(goal => (
              <span
                key={goal}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-500 text-white"
                role="listitem"
              >
                {goal}
                <button
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className="ml-2 hover:bg-blue-600 rounded-full p-0.5"
                  aria-label={`Remove ${goal}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Common goals suggestions */}
        <div className="flex flex-wrap gap-2">
          {commonGoals.filter(g => !state.goals.includes(g)).slice(0, 8).map(goal => (
            <button
              key={goal}
              type="button"
              onClick={() => toggleGoal(goal)}
              className="px-3 py-1 rounded-full text-sm transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              + {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Needed */}
      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            <Dumbbell className="inline h-4 w-4 mr-1" />
            Equipment Needed
          </legend>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Equipment selection">
            {commonEquipment.map(equipment => (
              <label
                key={equipment}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors cursor-pointer ${
                  state.equipmentNeeded.includes(equipment)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={state.equipmentNeeded.includes(equipment)}
                  onChange={() => toggleEquipment(equipment)}
                  className="sr-only"
                />
                {equipment}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={true}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={validateAndNext}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Step
        </button>
      </div>
    </div>
  );
};

export default ProgramForm;