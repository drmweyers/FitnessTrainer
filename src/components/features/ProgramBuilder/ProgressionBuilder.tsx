'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Minus,
  Target,
  Calculator,
  Info,
  AlertTriangle,
  BarChart3,
  Settings,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ProgramWeekData, WorkoutExerciseData, ExerciseConfigurationData } from '@/types/program';

interface ProgressionBuilderProps {
  weeks: ProgramWeekData[];
  onUpdateWeeks: (weeks: ProgramWeekData[]) => void;
  onClose?: () => void;
}

interface ProgressionConfig {
  exerciseId: string;
  exerciseName: string;
  progressionType: 'linear' | 'double' | 'wave' | 'deload' | 'autoregulation';
  // Linear progression
  weightIncrement?: number; // lbs per week
  repIncrement?: number; // additional reps per week
  // Double progression
  repRange?: { min: number; max: number };
  weightIncrementOnMax?: number;
  // Wave loading
  wavePattern?: number[]; // percentage increments by week
  // Deload
  deloadWeeks?: number[]; // which weeks are deload
  deloadPercentage?: number; // percentage reduction
  // Autoregulation
  targetRpe?: number;
  rpeAdjustment?: { [week: number]: number }; // RPE by week
}

interface ProgressionPreview {
  week: number;
  description: string;
  example: string;
  change: string;
}

const PROGRESSION_TYPES = [
  {
    value: 'linear',
    label: 'Linear Progression',
    description: 'Consistent weight/rep increases each week',
    icon: <TrendingUp size={16} />
  },
  {
    value: 'double',
    label: 'Double Progression',
    description: 'Increase reps first, then weight',
    icon: <Target size={16} />
  },
  {
    value: 'wave',
    label: 'Wave Loading',
    description: 'Cyclical intensity with peaks and valleys',
    icon: <BarChart3 size={16} />
  },
  {
    value: 'deload',
    label: 'Deload Weeks',
    description: 'Planned recovery weeks with reduced intensity',
    icon: <Minus size={16} />
  },
  {
    value: 'autoregulation',
    label: 'Autoregulation',
    description: 'RPE-based progression adjustments',
    icon: <Settings size={16} />
  }
];

const ProgressionBuilder: React.FC<ProgressionBuilderProps> = ({
  weeks,
  onUpdateWeeks,
  onClose
}) => {
  // Extract unique exercises across all weeks
  const [uniqueExercises] = useState(() => {
    const exerciseMap = new Map<string, { id: string; name: string; workoutCount: number }>();
    
    weeks.forEach(week => {
      week.workouts?.forEach(workout => {
        workout.exercises?.forEach(exercise => {
          const key = exercise.exerciseId;
          if (exerciseMap.has(key)) {
            exerciseMap.get(key)!.workoutCount += 1;
          } else {
            exerciseMap.set(key, {
              id: exercise.exerciseId,
              name: `Exercise ${exercise.orderIndex + 1}`, // Placeholder name
              workoutCount: 1
            });
          }
        });
      });
    });
    
    return Array.from(exerciseMap.values());
  });

  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [progressionConfigs, setProgressionConfigs] = useState<ProgressionConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<ProgressionConfig | null>(null);

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
        // Remove from configs
        setProgressionConfigs(configs => configs.filter(c => c.exerciseId !== exerciseId));
      } else {
        newSet.add(exerciseId);
        // Add default config
        const exercise = uniqueExercises.find(e => e.id === exerciseId);
        if (exercise) {
          const newConfig: ProgressionConfig = {
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            progressionType: 'linear',
            weightIncrement: 5,
            repIncrement: 0
          };
          setProgressionConfigs(configs => [...configs, newConfig]);
        }
      }
      return newSet;
    });
  };

  const updateProgressionConfig = (exerciseId: string, updates: Partial<ProgressionConfig>) => {
    setProgressionConfigs(configs => 
      configs.map(config => 
        config.exerciseId === exerciseId 
          ? { ...config, ...updates }
          : config
      )
    );
  };

  const generateProgressionPreview = (config: ProgressionConfig): ProgressionPreview[] => {
    const previews: ProgressionPreview[] = [];
    
    weeks.forEach((week, index) => {
      let description = '';
      let example = '';
      let change = '';

      switch (config.progressionType) {
        case 'linear':
          const weightIncrease = (config.weightIncrement || 5) * index;
          const repIncrease = (config.repIncrement || 0) * index;
          description = `Week ${week.weekNumber}`;
          example = `${weightIncrease > 0 ? `+${weightIncrease}lbs` : ''}${repIncrease > 0 ? ` +${repIncrease} reps` : ''}`;
          change = index === 0 ? 'Baseline' : `+${weightIncrease + repIncrease * 2.5}% intensity`;
          break;
          
        case 'double':
          const targetMin = config.repRange?.min || 6;
          const targetMax = config.repRange?.max || 10;
          description = `Week ${week.weekNumber}`;
          example = index < 2 ? `${targetMin}-${targetMax} reps` : `${targetMin}-${targetMax} reps +${config.weightIncrementOnMax || 5}lbs`;
          change = index < 2 ? 'Rep progression' : 'Weight progression';
          break;
          
        case 'wave':
          const wavePattern = config.wavePattern || [0, 5, 10, -5, 15, 20, -10];
          const waveValue = wavePattern[index % wavePattern.length] || 0;
          description = `Week ${week.weekNumber}`;
          example = waveValue >= 0 ? `+${waveValue}%` : `${waveValue}%`;
          change = waveValue >= 0 ? 'Intensity increase' : 'Recovery week';
          break;
          
        case 'deload':
          const isDeloadWeek = config.deloadWeeks?.includes(week.weekNumber) || week.isDeload;
          description = `Week ${week.weekNumber}`;
          example = isDeloadWeek ? `-${config.deloadPercentage || 30}%` : 'Normal intensity';
          change = isDeloadWeek ? 'Deload week' : 'Training week';
          break;
          
        case 'autoregulation':
          const targetRpe = config.targetRpe || 7;
          const rpeAdjustment = config.rpeAdjustment?.[week.weekNumber] || 0;
          description = `Week ${week.weekNumber}`;
          example = `RPE ${targetRpe + rpeAdjustment}`;
          change = rpeAdjustment > 0 ? 'Higher intensity' : rpeAdjustment < 0 ? 'Lower intensity' : 'Target intensity';
          break;
      }

      previews.push({
        week: week.weekNumber,
        description,
        example,
        change
      });
    });

    return previews;
  };

  const applyProgressions = () => {
    const updatedWeeks = weeks.map((week, weekIndex) => ({
      ...week,
      workouts: week.workouts?.map(workout => ({
        ...workout,
        exercises: workout.exercises?.map(exercise => {
          const config = progressionConfigs.find(c => c.exerciseId === exercise.exerciseId);
          if (!config) return exercise;

          // Apply progression logic to exercise configurations
          const updatedConfigurations = exercise.configurations?.map(conf => {
            const newConf = { ...conf };

            switch (config.progressionType) {
              case 'linear':
                // Add weight progression notes
                if (weekIndex > 0 && config.weightIncrement) {
                  const increment = config.weightIncrement * weekIndex;
                  newConf.notes = (newConf.notes || '') + ` [Week ${week.weekNumber}: +${increment}lbs]`;
                }
                if (weekIndex > 0 && config.repIncrement) {
                  const repInc = config.repIncrement * weekIndex;
                  newConf.notes = (newConf.notes || '') + ` [Week ${week.weekNumber}: +${repInc} reps]`;
                }
                break;

              case 'double':
                newConf.notes = (newConf.notes || '') + ` [Double progression: ${config.repRange?.min}-${config.repRange?.max} reps]`;
                break;

              case 'wave':
                const wavePattern = config.wavePattern || [0, 5, 10, -5, 15, 20, -10];
                const waveValue = wavePattern[weekIndex % wavePattern.length] || 0;
                newConf.notes = (newConf.notes || '') + ` [Wave loading: ${waveValue >= 0 ? '+' : ''}${waveValue}%]`;
                break;

              case 'deload':
                const isDeloadWeek = config.deloadWeeks?.includes(week.weekNumber) || week.isDeload;
                if (isDeloadWeek) {
                  newConf.notes = (newConf.notes || '') + ` [Deload: -${config.deloadPercentage || 30}%]`;
                }
                break;

              case 'autoregulation':
                const targetRpe = config.targetRpe || 7;
                const rpeAdjustment = config.rpeAdjustment?.[week.weekNumber] || 0;
                newConf.rpe = targetRpe + rpeAdjustment;
                newConf.notes = (newConf.notes || '') + ` [Target RPE: ${newConf.rpe}]`;
                break;
            }

            return newConf;
          });

          return {
            ...exercise,
            configurations: updatedConfigurations
          };
        }) || []
      })) || []
    }));

    onUpdateWeeks(updatedWeeks);
    onClose?.();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exercise Progression Builder</h2>
          <p className="text-gray-600 mt-2">
            Configure progressive overload patterns for systematic strength gains
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={applyProgressions} disabled={selectedExercises.size === 0}>
            Apply Progressions
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">How Progressive Overload Works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Select exercises</strong> you want to add progression to</li>
              <li>• <strong>Choose progression type</strong> based on training goals</li>
              <li>• <strong>Configure parameters</strong> like weight increments and rep ranges</li>
              <li>• <strong>Preview progression</strong> across all program weeks</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exercise Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Select Exercises ({selectedExercises.size})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {uniqueExercises.map(exercise => (
              <div 
                key={exercise.id}
                className="flex items-center space-x-3 p-3 bg-white border rounded-lg hover:border-blue-300 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedExercises.has(exercise.id)}
                  onChange={() => toggleExerciseSelection(exercise.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{exercise.name}</div>
                  <div className="text-sm text-gray-600">
                    Appears in {exercise.workoutCount} workout{exercise.workoutCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progression Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Progression Configuration</h3>
          
          {progressionConfigs.length > 0 ? (
            <div className="space-y-4">
              {progressionConfigs.map(config => (
                <div key={config.exerciseId} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">{config.exerciseName}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveConfig(activeConfig?.exerciseId === config.exerciseId ? null : config)}
                    >
                      {activeConfig?.exerciseId === config.exerciseId ? 'Hide' : 'Configure'}
                    </Button>
                  </div>

                  {/* Progression Type Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Progression Type
                    </label>
                    <select
                      value={config.progressionType}
                      onChange={(e) => updateProgressionConfig(config.exerciseId, { 
                        progressionType: e.target.value as ProgressionConfig['progressionType']
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {PROGRESSION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-600 mt-1">
                      {PROGRESSION_TYPES.find(t => t.value === config.progressionType)?.description}
                    </p>
                  </div>

                  {/* Configuration Options */}
                  {activeConfig?.exerciseId === config.exerciseId && (
                    <div className="space-y-4 border-t pt-4">
                      {config.progressionType === 'linear' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Weight increment (lbs/week)
                            </label>
                            <Input
                              type="number"
                              value={config.weightIncrement || ''}
                              onChange={(e) => updateProgressionConfig(config.exerciseId, {
                                weightIncrement: parseFloat(e.target.value) || 0
                              })}
                              placeholder="5"
                              min="0"
                              step="2.5"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rep increment (reps/week)
                            </label>
                            <Input
                              type="number"
                              value={config.repIncrement || ''}
                              onChange={(e) => updateProgressionConfig(config.exerciseId, {
                                repIncrement: parseInt(e.target.value) || 0
                              })}
                              placeholder="0"
                              min="0"
                              max="5"
                            />
                          </div>
                        </div>
                      )}

                      {config.progressionType === 'double' && (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Min reps
                            </label>
                            <Input
                              type="number"
                              value={config.repRange?.min || ''}
                              onChange={(e) => updateProgressionConfig(config.exerciseId, {
                                repRange: { 
                                  min: parseInt(e.target.value) || 6, 
                                  max: config.repRange?.max || 10 
                                }
                              })}
                              placeholder="6"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Max reps
                            </label>
                            <Input
                              type="number"
                              value={config.repRange?.max || ''}
                              onChange={(e) => updateProgressionConfig(config.exerciseId, {
                                repRange: { 
                                  min: config.repRange?.min || 6, 
                                  max: parseInt(e.target.value) || 10 
                                }
                              })}
                              placeholder="10"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Weight increment
                            </label>
                            <Input
                              type="number"
                              value={config.weightIncrementOnMax || ''}
                              onChange={(e) => updateProgressionConfig(config.exerciseId, {
                                weightIncrementOnMax: parseFloat(e.target.value) || 5
                              })}
                              placeholder="5"
                              step="2.5"
                            />
                          </div>
                        </div>
                      )}

                      {config.progressionType === 'autoregulation' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target RPE
                          </label>
                          <Input
                            type="number"
                            value={config.targetRpe || ''}
                            onChange={(e) => updateProgressionConfig(config.exerciseId, {
                              targetRpe: parseFloat(e.target.value) || 7
                            })}
                            placeholder="7"
                            min="6"
                            max="10"
                            step="0.5"
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            RPE 7 = 3 reps in reserve, RPE 8 = 2 reps in reserve
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progression Preview */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Progression Preview</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                      {generateProgressionPreview(config).slice(0, 4).map(preview => (
                        <div key={preview.week} className="bg-gray-50 p-2 rounded">
                          <div className="font-medium">{preview.description}</div>
                          <div className="text-blue-600">{preview.example}</div>
                          <div className="text-gray-600">{preview.change}</div>
                        </div>
                      ))}
                      {weeks.length > 4 && (
                        <div className="bg-gray-50 p-2 rounded flex items-center justify-center text-gray-500">
                          +{weeks.length - 4} more weeks
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Calculator size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Select exercises to configure their progression</p>
            </div>
          )}
        </div>
      </div>

      {/* Progressive Overload Benefits */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-start space-x-3">
          <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-green-900 mb-2">Progressive Overload Benefits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
              <div>
                <p><strong>Continuous Adaptation:</strong> Prevents plateaus</p>
                <p><strong>Measurable Progress:</strong> Clear advancement tracking</p>
              </div>
              <div>
                <p><strong>Injury Prevention:</strong> Gradual load increases</p>
                <p><strong>Long-term Success:</strong> Sustainable strength gains</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Actions */}
      <div className="flex justify-between pt-6 border-t">
        <div className="text-sm text-gray-600">
          {selectedExercises.size} exercise{selectedExercises.size !== 1 ? 's' : ''} with progression configured
        </div>
        <div className="flex space-x-3">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button onClick={applyProgressions} disabled={selectedExercises.size === 0}>
            Apply Progressive Overload
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProgressionBuilder;