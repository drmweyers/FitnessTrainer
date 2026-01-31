/**
 * ProgramBuilder Component
 *
 * Main multi-step form for creating and editing workout programs.
 * Steps: Basic Info → Goals & Equipment → Weeks → Exercises → Review
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Check, Save, Eye } from 'lucide-react';
import { WeekBuilder } from './WeekBuilder';
import { ProgramPreview } from './ProgramPreview';
import type { Program, ProgramWeek, ProgramType, DifficultyLevel } from '@/types/program';

interface ProgramBuilderProps {
  initialProgram?: Partial<Program>;
  onSave?: (program: Program) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

type Step = 'info' | 'goals' | 'weeks' | 'review';

const STEP_INFO = 0;
const STEP_GOALS = 1;
const STEP_WEEKS = 2;
const STEP_REVIEW = 3;

export function ProgramBuilder({
  initialProgram,
  onSave,
  onCancel,
  readOnly = false,
}: ProgramBuilderProps) {
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [program, setProgram] = useState<Partial<Program>>({
    name: initialProgram?.name || '',
    description: initialProgram?.description || '',
    programType: initialProgram?.programType || 'strength',
    difficultyLevel: initialProgram?.difficultyLevel || 'beginner',
    durationWeeks: initialProgram?.durationWeeks || 4,
    goals: initialProgram?.goals || [],
    equipmentNeeded: initialProgram?.equipmentNeeded || [],
    weeks: initialProgram?.weeks || [],
  });

  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    initialProgram?.goals || []
  );
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(
    initialProgram?.equipmentNeeded || []
  );

  const goalOptions = [
    'Build Muscle',
    'Lose Weight',
    'Increase Strength',
    'Improve Endurance',
    'Enhance Flexibility',
    'General Fitness',
    'Sport Performance',
    'Injury Prevention',
    'Rehabilitation',
  ];

  const equipmentOptions = [
    'Barbell',
    'Dumbbells',
    'Cable Machine',
    'Smith Machine',
    'Pull-up Bar',
    'Bench',
    'Squat Rack',
    'Resistance Bands',
    'Kettlebells',
    'Medicine Ball',
    'Bodyweight',
    'Cardio Equipment',
  ];

  // Step navigation
  const steps: Array<{ id: Step; title: string; description: string }> = [
    { id: 'info', title: 'Basic Info', description: 'Program name, type, and duration' },
    { id: 'goals', title: 'Goals & Equipment', description: 'Target outcomes and required gear' },
    { id: 'weeks', title: 'Week Structure', description: 'Add weeks and workouts' },
    { id: 'review', title: 'Review & Save', description: 'Preview and finalize' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const canGoNext = useCallback(() => {
    switch (currentStep) {
      case 'info':
        return (
          program.name?.trim() &&
          program.programType &&
          program.difficultyLevel &&
          program.durationWeeks
        );
      case 'goals':
        return true; // Goals and equipment are optional
      case 'weeks':
        return program.weeks && program.weeks.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  }, [currentStep, program]);

  const handleNext = () => {
    if (!canGoNext()) return;

    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleSave = () => {
    const completeProgram: Program = {
      id: initialProgram?.id || crypto.randomUUID(),
      ...program,
      goals: selectedGoals,
      equipmentNeeded: selectedEquipment,
      createdAt: initialProgram?.createdAt || new Date(),
      updatedAt: new Date(),
    } as Program;

    onSave?.(completeProgram);
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const toggleEquipment = (equipment: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(equipment)
        ? prev.filter((e) => e !== equipment)
        : [...prev, equipment]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {initialProgram?.id ? 'Edit Program' : 'Create New Program'}
          </h1>
          <p className="text-gray-600">Build a custom workout program</p>
        </div>
        <div className="flex gap-2">
          {!readOnly && (
            <>
              <Button variant="outline" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                index <= currentStepIndex
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-300 text-gray-300'
              }`}
            >
              {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <div className="ml-2 flex-1">
              <p className={`text-sm font-medium ${
                index <= currentStepIndex ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className="ml-4 flex-1 h-px bg-gray-300" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 'info' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Program Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., 12-Week Strength Program"
                  value={program.name}
                  onChange={(e) => setProgram({ ...program, name: e.target.value })}
                  disabled={readOnly}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your program..."
                  value={program.description}
                  onChange={(e) => setProgram({ ...program, description: e.target.value })}
                  disabled={readOnly}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Program Type *</Label>
                  <Select
                    value={program.programType}
                    onValueChange={(val) =>
                      setProgram({ ...program, programType: val as ProgramType })
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="hypertrophy">Hypertrophy</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                      <SelectItem value="powerlifting">Powerlifting</SelectItem>
                      <SelectItem value="bodybuilding">Bodybuilding</SelectItem>
                      <SelectItem value="general_fitness">General Fitness</SelectItem>
                      <SelectItem value="sport_specific">Sport Specific</SelectItem>
                      <SelectItem value="rehabilitation">Rehabilitation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty Level *</Label>
                  <Select
                    value={program.difficultyLevel}
                    onValueChange={(val) =>
                      setProgram({ ...program, difficultyLevel: val as DifficultyLevel })
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Duration (weeks) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="52"
                  placeholder="4"
                  value={program.durationWeeks}
                  onChange={(e) =>
                    setProgram({ ...program, durationWeeks: parseInt(e.target.value) || 4 })
                  }
                  disabled={readOnly}
                />
              </div>
            </div>
          )}

          {currentStep === 'goals' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Goals</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Select the primary goals for this program
                </p>
                <div className="flex flex-wrap gap-2">
                  {goalOptions.map((goal) => (
                    <Badge
                      key={goal}
                      variant={selectedGoals.includes(goal) ? 'default' : 'outline'}
                      className="cursor-pointer py-2 px-3"
                      onClick={() => !readOnly && toggleGoal(goal)}
                    >
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Equipment Needed</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Select equipment required for this program
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {equipmentOptions.map((equipment) => (
                    <Badge
                      key={equipment}
                      variant={selectedEquipment.includes(equipment) ? 'default' : 'outline'}
                      className="cursor-pointer py-2 px-3 justify-center"
                      onClick={() => !readOnly && toggleEquipment(equipment)}
                    >
                      {equipment}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'weeks' && (
            <WeekBuilder
              weeks={program.weeks || []}
              onUpdate={(weeks) => setProgram({ ...program, weeks })}
              readOnly={readOnly}
            />
          )}

          {currentStep === 'review' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review Your Program</h3>
              <ProgramPreview program={program as Program} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep === 'review' ? (
          <Button onClick={handleSave} disabled={readOnly}>
            <Save className="h-4 w-4 mr-2" />
            Save Program
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canGoNext() || readOnly}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <ProgramPreview
          program={program as Program}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
