/**
 * ProgramPreview Component
 *
 * Shows a read-only preview of the complete program structure.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Download, Calendar, Clock, Target } from 'lucide-react';
import { useState } from 'react';
import type { Program, ProgramWeek, ProgramWorkout } from '@/types/program';

interface ProgramPreviewProps {
  program: Program;
  onEdit?: () => void;
  onClose?: () => void;
}

export function ProgramPreview({ program, onEdit, onClose }: ProgramPreviewProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  const toggleWeek = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

  const expandAll = () => {
    setExpandedWeeks(new Set(program.weeks?.map((w) => w.weekNumber) || []));
  };

  const collapseAll = () => {
    setExpandedWeeks(new Set());
  };

  const totalWorkouts = program.weeks?.reduce(
    (sum, week) => sum + (week.workouts?.length || 0),
    0
  );

  const totalExercises = program.weeks?.reduce(
    (sum, week) =>
      sum +
      (week.workouts?.reduce((wSum, workout) => wSum + (workout.exercises?.length || 0), 0) ||
        0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{program.name}</h2>
          {program.description && (
            <p className="text-gray-600 mt-1">{program.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" onClick={collapseAll}>
            Collapse All
          </Button>
          {onEdit && (
            <Button onClick={onEdit}>
              Edit Program
            </Button>
          )}
        </div>
      </div>

      {/* Program Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-xl font-bold">{program.durationWeeks} weeks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Workouts</p>
                <p className="text-xl font-bold">{totalWorkouts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Exercises</p>
                <p className="text-xl font-bold">{totalExercises}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Avg Time</p>
                <p className="text-xl font-bold">
                  {Math.round(
                    (program.weeks?.reduce(
                      (sum, week) =>
                        sum +
                        (week.workouts?.reduce((wSum, w) => wSum + (w.estimatedDuration || 0), 0) ||
                          0),
                      0
                    ) || 0) / Math.max(totalWorkouts, 1)
                  )}{' '}
                  min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{program.programType}</Badge>
        <Badge variant="secondary">{program.difficultyLevel}</Badge>
        {program.goals?.map((goal) => (
          <Badge key={goal} variant="outline">
            {goal}
          </Badge>
        ))}
      </div>

      {/* Equipment */}
      {program.equipmentNeeded && program.equipmentNeeded.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Equipment Needed</h3>
          <div className="flex flex-wrap gap-2">
            {program.equipmentNeeded.map((eq) => (
              <Badge key={eq} variant="outline">
                {eq}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Week Structure */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-3 pr-4">
          {program.weeks?.map((week) => (
            <WeekPreview
              key={week.id}
              week={week}
              isExpanded={expandedWeeks.has(week.weekNumber)}
              onToggle={() => toggleWeek(week.weekNumber)}
            />
          )) || (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No weeks added yet
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-gray-500">
          {program.durationWeeks} weeks • {totalWorkouts} workouts
        </p>
        <Button onClick={onClose}>Close Preview</Button>
      </div>
    </div>
  );
}

interface WeekPreviewProps {
  week: ProgramWeek;
  isExpanded: boolean;
  onToggle: () => void;
}

function WeekPreview({ week, isExpanded, onToggle }: WeekPreviewProps) {
  return (
    <Card className={week.isDeload ? 'border-orange-200 bg-orange-50/50' : ''}>
      <CardHeader
        className="cursor-pointer py-3"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
            <div>
              <CardTitle className="text-base">
                Week {week.weekNumber}: {week.name}
              </CardTitle>
              {week.description && (
                <p className="text-sm text-gray-500 mt-1">{week.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {week.isDeload && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Deload
              </Badge>
            )}
            <Badge variant="outline">
              {week.workouts?.length || 0} workouts
            </Badge>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4 space-y-3">
          {week.workouts?.map((workout) => (
            <WorkoutPreview key={workout.id} workout={workout} />
          )) || <p className="text-sm text-gray-500">No workouts scheduled</p>}
        </CardContent>
      )}
    </Card>
  );
}

interface WorkoutPreviewProps {
  workout: ProgramWorkout;
}

function WorkoutPreview({ workout }: WorkoutPreviewProps) {
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
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="font-medium">{workout.name}</h4>
            <p className="text-xs text-gray-500">
              {dayNames[workout.dayNumber - 1]} • Day {workout.dayNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {workout.isRestDay ? (
              <Badge className="bg-green-100 text-green-800">Rest Day</Badge>
            ) : (
              <>
                <Badge variant="secondary">{workout.workoutType}</Badge>
                {workout.estimatedDuration && (
                  <span className="text-xs text-gray-500">
                    {workout.estimatedDuration}min
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {!workout.isRestDay && workout.exercises && workout.exercises.length > 0 && (
          <div className="space-y-2 mt-3">
            {workout.exercises.map((exercise, idx) => (
              <div key={exercise.id} className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-6">{idx + 1}.</span>
                <span>{exercise.exercise?.name || 'Unknown Exercise'}</span>
                {exercise.supersetGroup && (
                  <Badge variant="outline" className="text-xs">
                    {exercise.supersetGroup}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
