'use client';

import React, { useEffect } from 'react';
import { useProgramBuilder, programBuilderHelpers } from './ProgramBuilderContext';
import ProgramForm from './ProgramForm';
import WeekBuilder from './WeekBuilder';
import WorkoutBuilder from './WorkoutBuilder';
import ExerciseSelector from './ExerciseSelector';
import ProgramPreview from './ProgramPreview';
import { Save, X } from 'lucide-react';
import { ProgramData } from '@/types/program';

interface ProgramBuilderProps {
  onSave?: (programData: ProgramData, saveAsTemplate: boolean) => Promise<void>;
  onCancel?: () => void;
}

const ProgramBuilder: React.FC<ProgramBuilderProps> = ({
  onSave,
  onCancel
}) => {
  const { state, dispatch } = useProgramBuilder();

  // Load draft on mount if exists
  useEffect(() => {
    if (programBuilderHelpers.hasDraft()) {
      const confirmLoad = window.confirm('A draft program was found. Do you want to continue where you left off?');
      if (!confirmLoad) {
        programBuilderHelpers.clearDraft();
        dispatch({ type: 'RESET_STATE' });
      }
    }
  }, [dispatch]);

  const handleNext = () => {
    dispatch({ type: 'VALIDATE_CURRENT_STEP' });
    if (state.isValid) {
      dispatch({ type: 'NEXT_STEP' });
    } else {
      // Simple validation feedback without toast dependency
      alert('Please complete all required fields before proceeding');
    }
  };

  const handlePrev = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const handleStepClick = (step: number) => {
    if (step < state.currentStep) {
      dispatch({ type: 'SET_STEP', payload: step });
    } else if (step === state.currentStep + 1) {
      handleNext();
    }
  };

  const handleSave = async (programData: ProgramData, saveAsTemplate: boolean) => {
    if (onSave) {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        await onSave(programData, saveAsTemplate);

        // Clear draft after successful save
        programBuilderHelpers.clearDraft();
        dispatch({ type: 'RESET_STATE' });
      } catch (error) {
        console.error('Failed to save program:', error);
        // Error handling is done in the parent component
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      const hasUnsavedChanges = state.isDirty || programBuilderHelpers.hasDraft();
      if (hasUnsavedChanges) {
        const confirmCancel = window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.');
        if (confirmCancel) {
          programBuilderHelpers.clearDraft();
          dispatch({ type: 'RESET_STATE' });
          onCancel();
        }
      } else {
        onCancel();
      }
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <ProgramForm onNext={handleNext} onPrev={handlePrev} />;
      case 2:
        return <WeekBuilder onNext={handleNext} onPrev={handlePrev} />;
      case 3:
        return <WorkoutBuilder onNext={handleNext} onPrev={handlePrev} />;
      case 4:
        return <ExerciseSelector onNext={handleNext} onPrev={handlePrev} />;
      case 5:
        return <ProgramPreview onNext={handleNext} onPrev={handlePrev} onSave={handleSave} />;
      default:
        return null;
    }
  };

  const steps = [
    { number: 1, name: 'Program Info' },
    { number: 2, name: 'Weeks' },
    { number: 3, name: 'Workouts' },
    { number: 4, name: 'Exercises' },
    { number: 5, name: 'Preview' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Create Training Program</h1>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex-1 flex items-center">
                  <button
                    onClick={() => handleStepClick(step.number)}
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      step.number === state.currentStep
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : step.number < state.currentStep
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    } ${
                      step.number <= state.currentStep ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                    disabled={step.number > state.currentStep + 1}
                  >
                    {step.number < state.currentStep ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                      step.number < state.currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step) => (
                <div key={step.number} className="flex-1 text-center">
                  <p className={`text-xs mt-1 ${
                    step.number === state.currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {state.isDirty && (
            <div className="px-6 pt-6 pb-2">
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <Save className="inline h-4 w-4 mr-1" />
                Draft saved automatically
              </div>
            </div>
          )}
          
          <div className={state.isDirty ? "p-6 pt-4" : "p-6"}>
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramBuilder;