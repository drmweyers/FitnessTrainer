'use client';

import React, { useState } from 'react';
import {
  Link,
  Unlink,
  Timer,
  Info,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { WorkoutExerciseData } from '@/types/program';

interface SupersetBuilderProps {
  exercises: WorkoutExerciseData[];
  onUpdateExercises: (exercises: WorkoutExerciseData[]) => void;
  onClose?: () => void;
}

interface SupersetGroup {
  letter: string;
  color: string;
  exercises: WorkoutExerciseData[];
  restBetweenExercises: number; // seconds
  restAfterSuperset: number; // seconds
}

const SUPERSET_COLORS = [
  { letter: 'A', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { letter: 'B', color: 'bg-green-100 text-green-800 border-green-200' },
  { letter: 'C', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { letter: 'D', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { letter: 'E', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { letter: 'F', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
];

const SupersetBuilder: React.FC<SupersetBuilderProps> = ({
  exercises,
  onUpdateExercises,
  onClose
}) => {
  // Group exercises by superset
  const [supersetGroups, setSupersetGroups] = useState<SupersetGroup[]>(() => {
    const groups: { [key: string]: SupersetGroup } = {};
    const ungrouped: WorkoutExerciseData[] = [];

    exercises.forEach(exercise => {
      if (exercise.supersetGroup) {
        if (!groups[exercise.supersetGroup]) {
          const colorConfig = SUPERSET_COLORS.find(c => c.letter === exercise.supersetGroup) 
            || SUPERSET_COLORS[0];
          groups[exercise.supersetGroup] = {
            letter: exercise.supersetGroup,
            color: colorConfig.color,
            exercises: [],
            restBetweenExercises: 0,
            restAfterSuperset: 120
          };
        }
        groups[exercise.supersetGroup].exercises.push(exercise);
      } else {
        ungrouped.push(exercise);
      }
    });

    return [
      ...Object.values(groups),
      ...(ungrouped.length > 0 ? [{
        letter: '',
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        exercises: ungrouped,
        restBetweenExercises: 60,
        restAfterSuperset: 120
      }] : [])
    ];
  });

  const getNextAvailableLetter = () => {
    const usedLetters = supersetGroups
      .filter(group => group.letter !== '')
      .map(group => group.letter);
    
    return SUPERSET_COLORS.find(color => !usedLetters.includes(color.letter))?.letter || 'A';
  };

  const createSuperset = (exerciseIds: string[]) => {
    if (exerciseIds.length < 2) return;

    const letter = getNextAvailableLetter();
    const colorConfig = SUPERSET_COLORS.find(c => c.letter === letter) || SUPERSET_COLORS[0];
    
    const newSuperset: SupersetGroup = {
      letter,
      color: colorConfig.color,
      exercises: [],
      restBetweenExercises: 0,
      restAfterSuperset: 120
    };

    setSupersetGroups(prev => {
      const updated = prev.map(group => {
        const remainingExercises = group.exercises.filter(ex => 
          !exerciseIds.includes(ex.exerciseId)
        );
        
        // Add selected exercises to new superset
        const selectedExercises = group.exercises.filter(ex => 
          exerciseIds.includes(ex.exerciseId)
        ).map(ex => ({
          ...ex,
          supersetGroup: letter
        }));
        
        newSuperset.exercises.push(...selectedExercises);
        
        return {
          ...group,
          exercises: remainingExercises
        };
      }).filter(group => group.exercises.length > 0);

      return [...updated, newSuperset];
    });
  };

  const breakSuperset = (supersetLetter: string) => {
    setSupersetGroups(prev => {
      const targetGroup = prev.find(g => g.letter === supersetLetter);
      if (!targetGroup) return prev;

      const unGroupedExercises = targetGroup.exercises.map(ex => ({
        ...ex,
        supersetGroup: undefined
      }));

      const otherGroups = prev.filter(g => g.letter !== supersetLetter);
      const ungroupedGroup = otherGroups.find(g => g.letter === '');

      if (ungroupedGroup) {
        ungroupedGroup.exercises.push(...unGroupedExercises);
        return otherGroups;
      } else {
        return [
          ...otherGroups,
          {
            letter: '',
            color: 'bg-gray-50 text-gray-700 border-gray-200',
            exercises: unGroupedExercises,
            restBetweenExercises: 60,
            restAfterSuperset: 120
          }
        ];
      }
    });
  };

  const updateRestTimes = (groupLetter: string, restBetween: number, restAfter: number) => {
    setSupersetGroups(prev => 
      prev.map(group => 
        group.letter === groupLetter 
          ? { ...group, restBetweenExercises: restBetween, restAfterSuperset: restAfter }
          : group
      )
    );
  };

  const handleSave = () => {
    const updatedExercises = supersetGroups.flatMap(group => 
      group.exercises.map(exercise => ({
        ...exercise,
        supersetGroup: group.letter === '' ? undefined : group.letter
      }))
    );

    onUpdateExercises(updatedExercises);
    onClose?.();
  };

  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Superset Builder</h2>
          <p className="text-gray-600 mt-2">
            Group exercises into supersets and circuits for more efficient training
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => createSuperset(Array.from(selectedExercises))}
            disabled={selectedExercises.size < 2}
            leftIcon={<Link size={16} />}
          >
            Create Superset ({selectedExercises.size})
          </Button>
          <Button onClick={handleSave}>
            Save Changes
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
            <h4 className="font-medium text-blue-900 mb-2">How to Create Supersets</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Select 2+ exercises</strong> by clicking the checkboxes</li>
              <li>• <strong>Click "Create Superset"</strong> to group them with a letter (A, B, C...)</li>
              <li>• <strong>Drag exercises</strong> between groups or break supersets apart</li>
              <li>• <strong>Set rest times</strong> between exercises and after completing the superset</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Superset Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {supersetGroups.map((group) => (
          <div
            key={group.letter || 'ungrouped'}
            className={`border-2 rounded-lg p-4 ${group.color} ${
              group.letter === '' ? 'border-dashed' : 'border-solid'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {group.letter && (
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-lg">
                    {group.letter}
                  </div>
                )}
                <div>
                  <h3 className="font-medium">
                    {group.letter ? `Superset ${group.letter}` : 'Individual Exercises'}
                  </h3>
                  <p className="text-xs opacity-75">
                    {group.exercises.length} exercise{group.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              {group.letter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => breakSuperset(group.letter)}
                  leftIcon={<Unlink size={14} />}
                  className="text-xs"
                >
                  Break Apart
                </Button>
              )}
            </div>

            {/* Exercises in Group */}
            <div className="space-y-2 mb-4">
              {group.exercises.map((exercise, exerciseIndex) => (
                <div 
                  key={exercise.exerciseId}
                  className="flex items-center space-x-3 p-3 bg-white rounded border"
                >
                  <input
                    type="checkbox"
                    checked={selectedExercises.has(exercise.exerciseId)}
                    onChange={() => toggleExerciseSelection(exercise.exerciseId)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Exercise #{exercise.orderIndex + 1}</div>
                    <div className="text-sm text-gray-600">
                      {exercise.configurations?.length || 0} sets configured
                    </div>
                  </div>
                  {group.letter && exerciseIndex < group.exercises.length - 1 && (
                    <div className="text-xs text-gray-500 font-medium">
                      ↓ {group.restBetweenExercises}s
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Rest Time Configuration for Supersets */}
            {group.letter && group.exercises.length > 1 && (
              <div className="bg-white rounded p-3 space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Timer size={16} className="mr-2" />
                  Rest Configuration
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Between Exercises
                    </label>
                    <Input
                      type="number"
                      value={group.restBetweenExercises}
                      onChange={(e) => updateRestTimes(
                        group.letter,
                        parseInt(e.target.value) || 0,
                        group.restAfterSuperset
                      )}
                      placeholder="0"
                      min="0"
                      max="300"
                      className="text-sm"
                    />
                    <div className="text-xs text-gray-500 mt-1">seconds</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      After Superset
                    </label>
                    <Input
                      type="number"
                      value={group.restAfterSuperset}
                      onChange={(e) => updateRestTimes(
                        group.letter,
                        group.restBetweenExercises,
                        parseInt(e.target.value) || 120
                      )}
                      placeholder="120"
                      min="0"
                      max="600"
                      className="text-sm"
                    />
                    <div className="text-xs text-gray-500 mt-1">seconds</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Superset Benefits */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-start space-x-3">
          <AlertCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-green-900 mb-2">Superset Benefits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
              <div>
                <p><strong>Time Efficiency:</strong> Complete more work in less time</p>
                <p><strong>Intensity Boost:</strong> Increased metabolic demand</p>
              </div>
              <div>
                <p><strong>Muscle Pairing:</strong> Train opposing muscle groups</p>
                <p><strong>Variety:</strong> Keep workouts engaging and challenging</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Actions */}
      <div className="flex justify-between pt-6 border-t">
        <div className="text-sm text-gray-600">
          {supersetGroups.filter(g => g.letter !== '').length} supersets configured
        </div>
        <div className="flex space-x-3">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave}>
            Apply Superset Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupersetBuilder;