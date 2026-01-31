/**
 * ExerciseSelector Component
 *
 * Allows searching and selecting exercises to add to workouts.
 * Filters by muscle group, equipment, and difficulty.
 */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Dumbbell } from 'lucide-react';
import type { Exercise } from '@/types/exercise';

interface ExerciseSelectorProps {
  availableExercises: Exercise[];
  selectedExerciseIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onClose?: () => void;
}

export function ExerciseSelector({
  availableExercises,
  selectedExerciseIds,
  onSelectionChange,
  onClose,
}: ExerciseSelectorProps) {
  const [search, setSearch] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');

  // Get unique muscle groups and equipment
  const muscleGroups = useMemo(() => {
    const groups = new Set(availableExercises.map((e) => e.muscleGroup));
    return Array.from(groups).sort();
  }, [availableExercises]);

  const equipment = useMemo(() => {
    const equip = new Set(availableExercises.flatMap((e) => e.equipment || []));
    return Array.from(equip).sort();
  }, [availableExercises]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return availableExercises.filter((exercise) => {
      const matchesSearch =
        exercise.name.toLowerCase().includes(search.toLowerCase()) ||
        (exercise.muscleGroup?.toLowerCase() || '').includes(search.toLowerCase());

      const matchesMuscle =
        muscleGroupFilter === 'all' || exercise.muscleGroup === muscleGroupFilter;

      const matchesEquipment =
        equipmentFilter === 'all' ||
        (exercise.equipment || []).some((e) => e === equipmentFilter);

      return matchesSearch && matchesMuscle && matchesEquipment;
    });
  }, [availableExercises, search, muscleGroupFilter, equipmentFilter]);

  const toggleExercise = (exerciseId: string) => {
    if (selectedExerciseIds.includes(exerciseId)) {
      onSelectionChange(selectedExerciseIds.filter((id) => id !== exerciseId));
    } else {
      onSelectionChange([...selectedExerciseIds, exerciseId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(filteredExercises.map((e) => e.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Exercises</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={muscleGroupFilter} onValueChange={setMuscleGroupFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Muscle Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Muscle Groups</SelectItem>
              {muscleGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Equipment</SelectItem>
              <SelectItem value="bodyweight">Bodyweight</SelectItem>
              <SelectItem value="dumbbell">Dumbbell</SelectItem>
              <SelectItem value="barbell">Barbell</SelectItem>
              <SelectItem value="cable">Cable</SelectItem>
              <SelectItem value="machine">Machine</SelectItem>
              {equipment
                .filter((e) => !['bodyweight', 'dumbbell', 'barbell', 'cable', 'machine'].includes(e))
                .map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All ({filteredExercises.length})
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
        {selectedExerciseIds.length > 0 && ` (${selectedExerciseIds.length} selected)`}
      </p>

      {/* Exercise List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {filteredExercises.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                <Dumbbell className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No exercises found</p>
                <p className="text-sm text-gray-400">Try adjusting your filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                isSelected={selectedExerciseIds.includes(exercise.id)}
                onToggle={() => toggleExercise(exercise.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-gray-500">
          {selectedExerciseIds.length} selected
        </p>
        <Button onClick={onClose} disabled={selectedExerciseIds.length === 0}>
          Done
        </Button>
      </div>
    </div>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  isSelected: boolean;
  onToggle: () => void;
}

function ExerciseCard({ exercise, isSelected, onToggle }: ExerciseCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isSelected ? 'border-blue-500 bg-blue-50/50' : 'hover:bg-gray-50'
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox checked={isSelected} onCheckedChange={onToggle} />

          {exercise.gifUrl && (
            <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
              <img
                src={exercise.gifUrl}
                alt={exercise.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{exercise.name}</h4>
            <p className="text-xs text-gray-500 mt-1">{exercise.muscleGroup}</p>

            {exercise.equipment && exercise.equipment.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {exercise.equipment.slice(0, 3).map((eq) => (
                  <span
                    key={eq}
                    className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {eq}
                  </span>
                ))}
                {exercise.equipment.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                    +{exercise.equipment.length - 3}
                  </span>
                )}
              </div>
            )}

            {exercise.difficulty && (
              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                  exercise.difficulty === 'beginner'
                    ? 'bg-green-100 text-green-800'
                    : exercise.difficulty === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {exercise.difficulty}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
