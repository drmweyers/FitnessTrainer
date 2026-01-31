'use client';

import React, { useState } from 'react';
import { 
  Target, 
  TrendingUp,
  Info,
  Calculator,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { WorkoutExerciseData, ExerciseConfigurationData } from '@/types/program';

interface RPEIntegrationProps {
  exercises: WorkoutExerciseData[];
  onUpdateExercises: (exercises: WorkoutExerciseData[]) => void;
  onClose?: () => void;
}

interface RPEConfig {
  exerciseId: string;
  exerciseName: string;
  defaultRpe: number;
  defaultRir: number;
  autoAdjust: boolean;
  rpeProgression: { [week: number]: number };
}

const RPE_DESCRIPTIONS = [
  { value: 6, label: 'RPE 6', description: '4+ reps in reserve', color: 'text-green-600' },
  { value: 6.5, label: 'RPE 6.5', description: '3-4 reps in reserve', color: 'text-green-500' },
  { value: 7, label: 'RPE 7', description: '3 reps in reserve', color: 'text-yellow-600' },
  { value: 7.5, label: 'RPE 7.5', description: '2-3 reps in reserve', color: 'text-yellow-500' },
  { value: 8, label: 'RPE 8', description: '2 reps in reserve', color: 'text-orange-500' },
  { value: 8.5, label: 'RPE 8.5', description: '1-2 reps in reserve', color: 'text-orange-600' },
  { value: 9, label: 'RPE 9', description: '1 rep in reserve', color: 'text-red-500' },
  { value: 9.5, label: 'RPE 9.5', description: '0-1 reps in reserve', color: 'text-red-600' },
  { value: 10, label: 'RPE 10', description: 'Maximum effort', color: 'text-red-700' }
];

const RPEIntegration: React.FC<RPEIntegrationProps> = ({
  exercises,
  onUpdateExercises,
  onClose
}) => {
  // Extract unique exercises
  const [uniqueExercises] = useState(() => {
    const exerciseMap = new Map<string, { id: string; name: string; count: number }>();
    
    exercises.forEach(exercise => {
      const key = exercise.exerciseId;
      if (exerciseMap.has(key)) {
        exerciseMap.get(key)!.count += 1;
      } else {
        exerciseMap.set(key, {
          id: exercise.exerciseId,
          name: `Exercise ${exercise.orderIndex + 1}`, // Placeholder name
          count: 1
        });
      }
    });
    
    return Array.from(exerciseMap.values());
  });

  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [rpeConfigs, setRpeConfigs] = useState<RPEConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<RPEConfig | null>(null);

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
        setRpeConfigs(configs => configs.filter(c => c.exerciseId !== exerciseId));
      } else {
        newSet.add(exerciseId);
        const exercise = uniqueExercises.find(e => e.id === exerciseId);
        if (exercise) {
          const newConfig: RPEConfig = {
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            defaultRpe: 7,
            defaultRir: 3,
            autoAdjust: true,
            rpeProgression: {}
          };
          setRpeConfigs(configs => [...configs, newConfig]);
        }
      }
      return newSet;
    });
  };

  const updateRpeConfig = (exerciseId: string, updates: Partial<RPEConfig>) => {
    setRpeConfigs(configs => 
      configs.map(config => 
        config.exerciseId === exerciseId 
          ? { ...config, ...updates }
          : config
      )
    );
  };

  const applyRpeToExercises = () => {
    const updatedExercises = exercises.map(exercise => {
      const config = rpeConfigs.find(c => c.exerciseId === exercise.exerciseId);
      if (!config) return exercise;

      // Apply RPE/RIR to all configurations
      const updatedConfigurations = exercise.configurations?.map(conf => ({
        ...conf,
        rpe: config.defaultRpe,
        rir: config.defaultRir,
        notes: (conf.notes || '') + ` [Target RPE: ${config.defaultRpe}, RIR: ${config.defaultRir}]`
      })) || [];

      return {
        ...exercise,
        configurations: updatedConfigurations
      };
    });

    onUpdateExercises(updatedExercises);
    onClose?.();
  };

  const getRpeDescription = (rpe: number) => {
    return RPE_DESCRIPTIONS.find(desc => desc.value === rpe) || RPE_DESCRIPTIONS[2]; // Default to RPE 7
  };

  const calculateRIRFromRPE = (rpe: number): number => {
    if (rpe >= 10) return 0;
    if (rpe >= 9.5) return 0.5;
    if (rpe >= 9) return 1;
    if (rpe >= 8.5) return 1.5;
    if (rpe >= 8) return 2;
    if (rpe >= 7.5) return 2.5;
    if (rpe >= 7) return 3;
    if (rpe >= 6.5) return 3.5;
    return 4;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">RPE & RIR Integration</h2>
          <p className="text-gray-600 mt-2">
            Configure Rate of Perceived Exertion and Reps in Reserve for precise training intensity
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={applyRpeToExercises} disabled={selectedExercises.size === 0}>
            Apply RPE Settings
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* RPE/RIR Education */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Understanding RPE & RIR</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p><strong>RPE (Rate of Perceived Exertion):</strong> 1-10 scale rating how hard the set feels</p>
                <p><strong>RIR (Reps in Reserve):</strong> How many more reps you could have performed</p>
              </div>
              <div>
                <p><strong>Benefits:</strong> Precise intensity control and autoregulation</p>
                <p><strong>Usage:</strong> RPE 7-8 for strength, RPE 8-9 for hypertrophy</p>
              </div>
            </div>
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
                    {exercise.count} configuration{exercise.count !== 1 ? 's' : ''} will be updated
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RPE Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">RPE Configuration</h3>
          
          {rpeConfigs.length > 0 ? (
            <div className="space-y-4">
              {rpeConfigs.map(config => (
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

                  {/* Quick RPE Setting */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target RPE
                      </label>
                      <select
                        value={config.defaultRpe}
                        onChange={(e) => {
                          const newRpe = parseFloat(e.target.value);
                          updateRpeConfig(config.exerciseId, { 
                            defaultRpe: newRpe,
                            defaultRir: calculateRIRFromRPE(newRpe)
                          });
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {RPE_DESCRIPTIONS.map(rpe => (
                          <option key={rpe.value} value={rpe.value}>
                            {rpe.label} ({rpe.description})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reps in Reserve (RIR)
                      </label>
                      <Input
                        type="number"
                        value={config.defaultRir}
                        onChange={(e) => updateRpeConfig(config.exerciseId, {
                          defaultRir: parseFloat(e.target.value) || 0
                        })}
                        min="0"
                        max="5"
                        step="0.5"
                        className="text-center"
                      />
                    </div>
                  </div>

                  {/* RPE Visualization */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Intensity Guide</h5>
                    <div className="flex items-center justify-between text-xs">
                      <div className={`font-medium ${getRpeDescription(config.defaultRpe).color}`}>
                        {getRpeDescription(config.defaultRpe).label}
                      </div>
                      <div className="text-gray-600">
                        {getRpeDescription(config.defaultRpe).description}
                      </div>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          config.defaultRpe >= 9 ? 'bg-red-500' :
                          config.defaultRpe >= 8 ? 'bg-orange-500' :
                          config.defaultRpe >= 7 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(config.defaultRpe / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Advanced Configuration */}
                  {activeConfig?.exerciseId === config.exerciseId && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`autoAdjust-${config.exerciseId}`}
                          checked={config.autoAdjust}
                          onChange={(e) => updateRpeConfig(config.exerciseId, {
                            autoAdjust: e.target.checked
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`autoAdjust-${config.exerciseId}`} className="text-sm font-medium text-gray-700">
                          Enable autoregulation (adjust based on performance)
                        </label>
                      </div>
                      
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex items-start space-x-2">
                          <Calculator size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">Autoregulation Tips</p>
                            <ul className="space-y-1">
                              <li>• If feeling strong: Increase RPE by 0.5</li>
                              <li>• If feeling fatigued: Decrease RPE by 0.5-1</li>
                              <li>• Use RPE 7-8 for building weeks</li>
                              <li>• Use RPE 6-7 for deload weeks</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Target size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Select exercises to configure RPE and RIR</p>
            </div>
          )}
        </div>
      </div>

      {/* RPE Scale Reference */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">RPE Scale Reference</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-green-600 mb-2">Light Intensity (RPE 6-7)</div>
            <ul className="space-y-1 text-gray-700">
              <li>• Warm-up sets</li>
              <li>• Technique practice</li>
              <li>• Deload weeks</li>
              <li>• Active recovery</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-orange-500 mb-2">Moderate Intensity (RPE 7-8)</div>
            <ul className="space-y-1 text-gray-700">
              <li>• Strength building</li>
              <li>• Volume accumulation</li>
              <li>• Technical refinement</li>
              <li>• Base building phases</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-red-500 mb-2">High Intensity (RPE 8-10)</div>
            <ul className="space-y-1 text-gray-700">
              <li>• Max strength testing</li>
              <li>• Competition prep</li>
              <li>• Peak intensity weeks</li>
              <li>• Use sparingly</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Apply Actions */}
      <div className="flex justify-between pt-6 border-t">
        <div className="text-sm text-gray-600">
          {selectedExercises.size} exercise{selectedExercises.size !== 1 ? 's' : ''} configured for RPE/RIR
        </div>
        <div className="flex space-x-3">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button onClick={applyRpeToExercises} disabled={selectedExercises.size === 0}>
            Apply RPE & RIR Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RPEIntegration;