'use client';

import React, { useState } from 'react';
import { useProgramBuilder } from './ProgramBuilderContext';
import TemplateLibrary from './TemplateLibrary';
import { ProgramType, DifficultyLevel } from '@/types/program';
import { Target, Dumbbell, Clock, Tag, FileText, Plus } from 'lucide-react';

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
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

  const handleBasicInfoChange = (field: string, value: any) => {
    dispatch({
      type: 'SET_BASIC_INFO',
      payload: { [field]: value }
    });
  };

  const toggleGoal = (goal: string) => {
    const newGoals = state.goals.includes(goal)
      ? state.goals.filter(g => g !== goal)
      : [...state.goals, goal];
    handleBasicInfoChange('goals', newGoals);
  };

  const toggleEquipment = (equipment: string) => {
    const newEquipment = state.equipmentNeeded.includes(equipment)
      ? state.equipmentNeeded.filter(e => e !== equipment)
      : [...state.equipmentNeeded, equipment];
    handleBasicInfoChange('equipmentNeeded', newEquipment);
  };

  const handleApplyTemplate = (template: any) => {
    // Apply template data to form
    dispatch({
      type: 'SET_BASIC_INFO',
      payload: {
        name: template.name,
        description: template.description,
        programType: template.programType,
        difficultyLevel: template.difficultyLevel,
        durationWeeks: template.durationWeeks,
        goals: template.tags || [], // Use tags as goals for now
        equipmentNeeded: [] // Would be derived from template exercises
      }
    });
    setShowTemplateLibrary(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Program Information</h2>
          <button
            type="button"
            onClick={() => setShowTemplateLibrary(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FileText className="h-4 w-4 mr-2" />
            Browse Templates
          </button>
        </div>
        <p className="text-gray-600 mb-6">
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
        {state.errors.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name}</p>
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
        {state.errors.programType && (
          <p className="mt-1 text-sm text-red-600">{state.errors.programType}</p>
        )}
      </div>

      {/* Difficulty Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Difficulty Level <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {difficultyLevels.map(level => (
            <button
              key={level.value}
              type="button"
              onClick={() => handleBasicInfoChange('difficultyLevel', level.value)}
              className={`p-3 border-2 rounded-lg text-left transition-colors ${
                state.difficultyLevel === level.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{level.label}</div>
              <div className="text-xs text-gray-500 mt-1">{level.description}</div>
            </button>
          ))}
        </div>
        {state.errors.difficultyLevel && (
          <p className="mt-1 text-sm text-red-600">{state.errors.difficultyLevel}</p>
        )}
      </div>

      {/* Duration */}
      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
          <Clock className="inline h-4 w-4 mr-1" />
          Program Duration (weeks) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            id="duration"
            min="1"
            max="52"
            value={state.durationWeeks}
            onChange={(e) => handleBasicInfoChange('durationWeeks', parseInt(e.target.value))}
            className="flex-1"
          />
          <div className="w-20">
            <input
              type="number"
              min="1"
              max="52"
              value={state.durationWeeks}
              onChange={(e) => handleBasicInfoChange('durationWeeks', parseInt(e.target.value) || 1)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-center"
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {state.durationWeeks} week{state.durationWeeks !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Goals */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Target className="inline h-4 w-4 mr-1" />
          Program Goals
        </label>
        <div className="flex flex-wrap gap-2">
          {commonGoals.map(goal => (
            <button
              key={goal}
              type="button"
              onClick={() => toggleGoal(goal)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                state.goals.includes(goal)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Needed */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Dumbbell className="inline h-4 w-4 mr-1" />
          Equipment Needed
        </label>
        <div className="flex flex-wrap gap-2">
          {commonEquipment.map(equipment => (
            <button
              key={equipment}
              type="button"
              onClick={() => toggleEquipment(equipment)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                state.equipmentNeeded.includes(equipment)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {equipment}
            </button>
          ))}
        </div>
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
          onClick={onNext}
          disabled={!state.name || !state.programType || !state.difficultyLevel}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowTemplateLibrary(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <TemplateLibrary 
                  onSelectTemplate={handleApplyTemplate}
                  onClose={() => setShowTemplateLibrary(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramForm;