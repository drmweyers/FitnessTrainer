/**
 * WorkoutBuilder Component
 *
 * Allows adding, editing, and deleting workouts within a week.
 * Supports workout types, rest days, and duration estimation.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Edit, Dumbbell } from 'lucide-react';
import type { ProgramWorkout, WorkoutType } from '@/types/program';

interface WorkoutBuilderProps {
  workouts: ProgramWorkout[];
  onUpdate: (workouts: ProgramWorkout[]) => void;
  readOnly?: boolean;
}

export function WorkoutBuilder({ workouts, onUpdate, readOnly = false }: WorkoutBuilderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    dayNumber: workouts.length + 1,
    name: '',
    description: '',
    workoutType: 'strength' as WorkoutType,
    estimatedDuration: 60,
    isRestDay: false,
  });

  const handleAddWorkout = () => {
    if (!newWorkout.name.trim()) return;

    const workout: ProgramWorkout = {
      id: crypto.randomUUID(),
      ...newWorkout,
      exercises: [],
    };

    onUpdate([...workouts, workout]);
    setNewWorkout({
      dayNumber: workouts.length + 2,
      name: '',
      description: '',
      workoutType: 'strength',
      estimatedDuration: 60,
      isRestDay: false,
    });
    setDialogOpen(false);
  };

  const handleDeleteWorkout = (id: string) => {
    if (confirm('Delete this workout?')) {
      onUpdate(workouts.filter((w) => w.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Workouts</h3>
        {!readOnly && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Workout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Workout</DialogTitle>
                <DialogDescription>
                  Add a workout to this week
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workout-day">Day *</Label>
                  <Select
                    value={newWorkout.dayNumber.toString()}
                    onValueChange={(val) =>
                      setNewWorkout({ ...newWorkout, dayNumber: parseInt(val) })
                    }
                  >
                    <SelectTrigger id="workout-day">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 7 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][
                            i
                          ]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="workout-name">Workout Name *</Label>
                  <Input
                    id="workout-name"
                    placeholder="e.g., Upper Body Strength"
                    value={newWorkout.name}
                    onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="workout-type">Type</Label>
                  <Select
                    value={newWorkout.workoutType}
                    onValueChange={(val) =>
                      setNewWorkout({ ...newWorkout, workoutType: val as WorkoutType })
                    }
                  >
                    <SelectTrigger id="workout-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="hypertrophy">Hypertrophy</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="hiit">HIIT</SelectItem>
                      <SelectItem value="flexibility">Flexibility</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="recovery">Recovery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="60"
                    value={newWorkout.estimatedDuration}
                    onChange={(e) =>
                      setNewWorkout({
                        ...newWorkout,
                        estimatedDuration: parseInt(e.target.value) || 60,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="workout-description">Description</Label>
                  <Textarea
                    id="workout-description"
                    placeholder="Optional description..."
                    value={newWorkout.description}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="rest-day"
                    checked={newWorkout.isRestDay}
                    onCheckedChange={(checked) =>
                      setNewWorkout({ ...newWorkout, isRestDay: checked })
                    }
                  />
                  <Label htmlFor="rest-day">Rest Day</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddWorkout}>Add Workout</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            onDelete={() => handleDeleteWorkout(workout.id)}
            readOnly={readOnly}
          />
        ))}
      </div>

      {workouts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Dumbbell className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No workouts scheduled</p>
            {!readOnly && <Button onClick={() => setDialogOpen(true)}>Add Workout</Button>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface WorkoutCardProps {
  workout: ProgramWorkout;
  onDelete: () => void;
  readOnly: boolean;
}

function WorkoutCard({ workout, onDelete, readOnly }: WorkoutCardProps) {
  const dayNames = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  return (
    <Card className={workout.isRestDay ? 'border-green-200 bg-green-50/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500">
                Day {workout.dayNumber}
              </span>
              {workout.isRestDay ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                  Rest Day
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs capitalize">
                  {workout.workoutType}
                </span>
              )}
            </div>
            <CardTitle className="text-base">{workout.name}</CardTitle>
          </div>
          {!readOnly && (
            <Button size="icon" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {workout.description && (
          <p className="text-gray-600">{workout.description}</p>
        )}
        {workout.estimatedDuration && !workout.isRestDay && (
          <p className="text-gray-500">
            ⏱ {workout.estimatedDuration} minutes
          </p>
        )}
        {workout.exercises && workout.exercises.length > 0 && (
          <p className="text-gray-500">
            💪 {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
