'use client';

import React, { useEffect, useState, useCallback, Component, ErrorInfo } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTier } from '@/hooks/useTier';
import { useProgramBuilder, programBuilderHelpers, validateCurrentStep } from './ProgramBuilderContext';
import ProgramForm from './ProgramForm';
import WeekBuilder from './WeekBuilder';
import WorkoutBuilder from './WorkoutBuilder';
import ExerciseSelector from './ExerciseSelector';
import ProgramPreview from './ProgramPreview';
import ExerciseLibraryPanel from './ExerciseLibraryPanel';
import WorkoutCanvas from './WorkoutCanvas';
import ExerciseConfigDrawer from './ExerciseConfigDrawer';
import ProgramOutline from './ProgramOutline';
import { Download, Save, X } from 'lucide-react';
import { ProgramData } from '@/types/program';
import type { LibraryExercise } from './useExerciseLibrary';
import type { WorkoutExerciseDataExtended } from '@/types/program';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { Button } from '@/components/ui/button';

interface OutlineBoundaryState { hasError: boolean }

/** Silently swallows render errors in the outline panel so the main builder stays functional. */
class OutlineBoundary extends Component<{ children: React.ReactNode }, OutlineBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_error: unknown): OutlineBoundaryState {
    return { hasError: true };
  }
  override componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Outline is non-critical; fail silently in production.
  }
  override render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

interface ProgramBuilderProps {
  onSave?: (programData: ProgramData, saveAsTemplate: boolean) => Promise<void>;
  onCancel?: () => void;
  /** When provided (after first save), enables the Export PDF button */
  savedProgramId?: string;
}

const ProgramBuilder: React.FC<ProgramBuilderProps> = ({
  onSave,
  onCancel,
  savedProgramId,
}) => {
  const { state, dispatch } = useProgramBuilder();
  const { hasFeature } = useTier();
  const [isClient, setIsClient] = useState(false);
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [configExercise, setConfigExercise] = useState<WorkoutExerciseDataExtended | null>(null);
  const [configWeekIdx, setConfigWeekIdx] = useState(0);
  const [configWorkoutIdx, setConfigWorkoutIdx] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Pro/Enterprise: add TouchSensor with tighter activation for mobile drag
  const hasMobileDrag = hasFeature('programBuilder.mobileDragOptimised');
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } });
  const sensors = useSensors(
    pointerSensor,
    keyboardSensor,
    ...(hasMobileDrag ? [touchSensor] : []),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeType = active.data.current?.type;
      const exercise = active.data.current?.exercise as LibraryExercise | undefined;

      if (activeType === 'library-exercise' && exercise) {
        dispatch({
          type: 'ADD_EXERCISE_TO_WORKOUT',
          payload: {
            weekIdx: state.currentWeekIndex,
            workoutIdx: state.currentWorkoutIndex,
            exercise: {
              id: exercise.id,
              name: exercise.name,
              gifUrl: exercise.gifUrl,
              targetMuscle: exercise.targetMuscle,
              equipment: exercise.equipment,
            },
          },
        });
      } else if (activeType === 'workout-exercise') {
        const from = active.data.current?.location;
        if (String(over.id) === 'workout-trash' && from) {
          dispatch({
            type: 'REMOVE_WORKOUT_EXERCISE',
            payload: from,
          });
        } else {
          // Cross-section/reorder: to be wired when section drop targets expose location.
          dispatch({
            type: 'MOVE_EXERCISE' as any,
            payload: { from: active.id, to: over.id },
          } as any);
        }
      }
    },
    [dispatch, state.currentWeekIndex, state.currentWorkoutIndex],
  );

  const handleOpenConfig = (exercise: WorkoutExerciseDataExtended) => {
    setConfigExercise(exercise);
    setConfigWeekIdx(state.currentWeekIndex);
    setConfigWorkoutIdx(state.currentWorkoutIndex);
    setConfigDrawerOpen(true);
  };

  const handleAddExercise = (exercise: LibraryExercise) => {
    dispatch({
      type: 'ADD_EXERCISE_TO_WORKOUT',
      payload: {
        weekIdx: state.currentWeekIndex,
        workoutIdx: state.currentWorkoutIndex,
        exercise: {
          id: exercise.id,
          name: exercise.name,
          gifUrl: exercise.gifUrl,
          targetMuscle: exercise.targetMuscle,
          equipment: exercise.equipment,
        },
      },
    });
  };

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
    // Compute validity from current state synchronously — do NOT use state.isValid
    // which is stale in the closure until the next render after VALIDATE_CURRENT_STEP dispatch.
    const isCurrentlyValid = validateCurrentStep(state);
    dispatch({ type: 'VALIDATE_CURRENT_STEP' }); // keeps state.isValid in sync for derived UI
    if (isCurrentlyValid) {
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
        if (isClient) {
          return (
            <DndContext
              sensors={sensors}
              collisionDetection={rectIntersection}
              onDragEnd={handleDragEnd}
            >
              <div
                className="flex h-[calc(100vh-220px)] overflow-hidden"
                data-dnd-ready
                data-testid="program-builder-canvas"
              >
                <ExerciseLibraryPanel onAddExercise={handleAddExercise} />
                <WorkoutCanvas
                  weekIdx={state.currentWeekIndex}
                  workoutIdx={state.currentWorkoutIndex}
                  onOpenConfig={handleOpenConfig}
                />
                {/* OUTLINE — integration step */}
                <div className="w-64 hidden xl:block" data-outline-placeholder />
              </div>
              {configDrawerOpen && (
                <ExerciseConfigDrawer
                  exercise={configExercise}
                  exerciseName={configExercise?.exerciseId ?? ''}
                  open={configDrawerOpen}
                  onClose={() => setConfigDrawerOpen(false)}
                  weekIdx={configWeekIdx}
                  workoutIdx={configWorkoutIdx}
                />
              )}
            </DndContext>
          );
        }
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
            <div className="flex items-center gap-3">
              {/* Export PDF — Professional + Enterprise, only when program is saved */}
              <FeatureGate feature="programBuilder.pdfExport" minimal>
                <button
                  onClick={() => {
                    if (savedProgramId) {
                      const token = typeof window !== 'undefined'
                        ? localStorage.getItem('accessToken')
                        : null;
                      const url = `/api/programs/${savedProgramId}/export${token ? `?token=${encodeURIComponent(token)}` : ''}`;
                      window.open(url, '_blank');
                    }
                  }}
                  disabled={!savedProgramId}
                  title={savedProgramId ? 'Export program as PDF' : 'Save the program first to enable export'}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Export PDF"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </button>
              </FeatureGate>

              <button
                data-testid="cancel-program-btn"
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
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

        {/* Step Content + Outline Panel */}
        <div className="flex gap-0 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex-1 min-w-0">
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

          {/* Right Outline Panel (visible on xl+ screens) */}
          <OutlineBoundary>
            <ProgramOutline />
          </OutlineBoundary>
        </div>
      </div>
    </div>
  );
};

export default ProgramBuilder;