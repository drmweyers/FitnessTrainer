'use client';

import React, { useState, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Dumbbell,
  Zap,
  Clock,
  Timer,
  Repeat,
  Target,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProgramBuilder } from './ProgramBuilderContext';
import { WorkoutType, ProgramWeekData, ProgramWorkoutData, WorkoutExerciseData } from '@/types/program';

/** Runtime exercises may carry the full `exercise` relation even though WorkoutExerciseData doesn't declare it. */
type WorkoutExerciseWithRelation = WorkoutExerciseData & {
  exercise?: { id: string; name: string; [key: string]: unknown };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Total exercise count across the entire program */
function countTotalExercises(weeks: ProgramWeekData[]): number {
  return weeks.reduce((total, week) => {
    return total + (week.workouts ?? []).reduce((wTotal, workout) => {
      return wTotal + (workout.exercises ?? []).length;
    }, 0);
  }, 0);
}

/** Group exercises by their supersetGroup (undefined/null = individual exercise) */
interface ExerciseGroup {
  supersetGroup: string | undefined;
  exercises: WorkoutExerciseWithRelation[];
}

function groupExercises(exercises: WorkoutExerciseWithRelation[]): ExerciseGroup[] {
  const groups: ExerciseGroup[] = [];
  const seenGroups = new Map<string, ExerciseGroup>();

  for (const ex of exercises) {
    const sg = ex.supersetGroup;
    if (sg) {
      if (seenGroups.has(sg)) {
        seenGroups.get(sg)!.exercises.push(ex);
      } else {
        const group: ExerciseGroup = { supersetGroup: sg, exercises: [ex] };
        seenGroups.set(sg, group);
        groups.push(group);
      }
    } else {
      groups.push({ supersetGroup: undefined, exercises: [ex] });
    }
  }
  return groups;
}

/** Pick icon based on workout type */
function WorkoutIcon({ workoutType }: { workoutType?: WorkoutType }) {
  switch (workoutType) {
    case WorkoutType.CARDIO:
      return <Timer className="h-3 w-3 flex-shrink-0" />;
    case WorkoutType.HIIT:
      return <Zap className="h-3 w-3 flex-shrink-0" />;
    case WorkoutType.FLEXIBILITY:
      return <Repeat className="h-3 w-3 flex-shrink-0" />;
    case WorkoutType.RECOVERY:
      return <Clock className="h-3 w-3 flex-shrink-0" />;
    case WorkoutType.MIXED:
      return <Target className="h-3 w-3 flex-shrink-0" />;
    case WorkoutType.STRENGTH:
    default:
      return <Dumbbell className="h-3 w-3 flex-shrink-0" />;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ExerciseLeafProps {
  name: string;
}

const ExerciseLeaf: React.FC<ExerciseLeafProps> = ({ name }) => (
  <li
    role="treeitem"
    aria-selected={false}
    aria-label={name}
    className="flex items-center gap-1.5 py-0.5 pl-2 pr-1 text-xs text-gray-600 truncate"
  >
    <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
    <span className="truncate">{name}</span>
  </li>
);

interface SupersetGroupProps {
  label: string;
  exercises: WorkoutExerciseWithRelation[];
}

const SupersetGroup: React.FC<SupersetGroupProps> = ({ label, exercises }) => (
  <li role="treeitem" aria-selected={false} aria-label={label} className="mt-0.5">
    <div className="flex items-center gap-1 px-1 py-0.5">
      <span className="text-xs font-medium text-violet-600 truncate">{label}</span>
    </div>
    <ul role="group" className="pl-3">
      {exercises.map((ex) => (
        <ExerciseLeaf
          key={ex.exerciseId}
          name={ex.exercise?.name ?? ex.exerciseId}
        />
      ))}
    </ul>
  </li>
);

interface WorkoutNodeProps {
  workout: ProgramWorkoutData;
  weekIndex: number;
  workoutIndex: number;
  isActive: boolean;
  onNavigate: (_weekIdx: number, _workoutIdx: number) => void;
}

const WorkoutNode: React.FC<WorkoutNodeProps> = ({
  workout,
  weekIndex,
  workoutIndex,
  isActive,
  onNavigate,
}) => {
  const exercises: WorkoutExerciseWithRelation[] = (workout.exercises ?? []) as WorkoutExerciseWithRelation[];
  const groups = groupExercises(exercises);

  const handleActivate = useCallback(() => {
    onNavigate(weekIndex, workoutIndex);
  }, [onNavigate, weekIndex, workoutIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  return (
    <li>
      <div
        role="treeitem"
        tabIndex={0}
        aria-selected={isActive}
        aria-label={`Day ${workout.dayNumber} ${workout.name}`}
        className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs transition-colors
          ${isActive
            ? 'bg-blue-100 text-blue-800 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
          }`}
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
      >
        <WorkoutIcon workoutType={workout.workoutType} />
        <span className="font-medium text-gray-500 flex-shrink-0">Day {workout.dayNumber}</span>
        <span className="truncate">{workout.name}</span>
      </div>

      {/* Exercises */}
      <ul role="group" className="pl-4 pb-0.5">
        {exercises.length === 0 ? (
          <li className="py-0.5 px-2 text-xs text-gray-400 italic">No exercises yet</li>
        ) : (
          groups.map((group, gi) =>
            group.supersetGroup ? (
              <SupersetGroup
                key={`sg-${group.supersetGroup}-${gi}`}
                label={`Superset ${group.supersetGroup}`}
                exercises={group.exercises}
              />
            ) : (
              <ExerciseLeaf
                key={`ex-${group.exercises[0].exerciseId}-${gi}`}
                name={group.exercises[0].exercise?.name ?? group.exercises[0].exerciseId}
              />
            )
          )
        )}
      </ul>
    </li>
  );
};

interface WeekNodeProps {
  week: ProgramWeekData;
  weekIndex: number;
  isActiveWeek: boolean;
  activeWorkoutIndex: number;
  onNavigateWorkout: (_weekIdx: number, _workoutIdx: number) => void;
  onNavigateWeek: (_weekIdx: number) => void;
}

const WeekNode: React.FC<WeekNodeProps> = ({
  week,
  weekIndex,
  isActiveWeek,
  activeWorkoutIndex,
  onNavigateWorkout,
  onNavigateWeek,
}) => {
  const [expanded, setExpanded] = useState(true);
  const workouts = week.workouts ?? [];

  const handleWeekClick = () => {
    onNavigateWeek(weekIndex);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <li
      data-week-index={weekIndex}
      className={`mb-1 rounded transition-colors ${
        isActiveWeek ? 'bg-blue-50' : ''
      }`}
    >
      {/* Week header row — the treeitem is here */}
      <div
        role="treeitem"
        tabIndex={0}
        aria-expanded={expanded}
        aria-selected={isActiveWeek}
        aria-label={`Week ${week.weekNumber} ${week.name}`}
        data-week-index={weekIndex}
        className={`flex items-center gap-1 px-1.5 py-1.5 rounded cursor-pointer select-none
          ${isActiveWeek ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
        onClick={handleWeekClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigateWeek(weekIndex);
          }
        }}
      >
        {/* Chevron toggle */}
        <button
          type="button"
          aria-label={expanded ? 'Collapse week' : 'Expand week'}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-0.5 rounded"
          onClick={handleChevronClick}
          tabIndex={-1}
        >
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />

        <span className="text-xs font-semibold text-gray-800 truncate flex-1">
          Week {week.weekNumber}
          {week.name && week.name !== `Week ${week.weekNumber}` && (
            <span className="font-normal text-gray-500"> · {week.name}</span>
          )}
        </span>

        {week.isDeload && (
          <span className="ml-auto flex-shrink-0 text-[10px] font-medium px-1 py-0.5 rounded bg-amber-100 text-amber-700">
            Deload
          </span>
        )}
      </div>

      {/* Collapsible children */}
      {expanded && (
        <ul role="group" className="pl-2 pb-1">
          {workouts.length === 0 ? (
            <li className="py-1 px-2 text-xs text-gray-400 italic">No workouts yet</li>
          ) : (
            workouts.map((workout, wi) => (
              <WorkoutNode
                key={`workout-${weekIndex}-${wi}`}
                workout={workout}
                weekIndex={weekIndex}
                workoutIndex={wi}
                isActive={isActiveWeek && activeWorkoutIndex === wi}
                onNavigate={onNavigateWorkout}
              />
            ))
          )}
        </ul>
      )}
    </li>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ProgramOutline: React.FC = () => {
  const { state, dispatch } = useProgramBuilder();
  const { weeks: rawWeeks, currentWeekIndex, currentWorkoutIndex } = state;
  const weeks: ProgramWeekData[] = rawWeeks ?? [];

  const totalExercises = countTotalExercises(weeks);

  const handleNavigateWorkout = useCallback(
    (weekIdx: number, workoutIdx: number) => {
      dispatch({ type: 'SET_CURRENT_WEEK', payload: weekIdx });
      dispatch({ type: 'SET_CURRENT_WORKOUT', payload: workoutIdx });
    },
    [dispatch]
  );

  const handleNavigateWeek = useCallback(
    (weekIdx: number) => {
      dispatch({ type: 'SET_CURRENT_WEEK', payload: weekIdx });
    },
    [dispatch]
  );

  return (
    <aside data-testid="program-outline" className="w-64 hidden xl:flex flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-800">Outline</span>
        <span className="text-xs text-gray-400">
          {totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1 overflow-y-auto">
        {weeks.length === 0 ? (
          <p className="px-3 py-4 text-xs text-gray-400 italic text-center">
            Add your first week and workout to get started
          </p>
        ) : (
          <ul
            role="tree"
            aria-label="Program structure"
            className="p-2 space-y-0.5"
          >
            {weeks.map((week, wi) => (
              <WeekNode
                key={`week-${wi}`}
                week={week}
                weekIndex={wi}
                isActiveWeek={currentWeekIndex === wi}
                activeWorkoutIndex={currentWorkoutIndex}
                onNavigateWorkout={handleNavigateWorkout}
                onNavigateWeek={handleNavigateWeek}
              />
            ))}
          </ul>
        )}
      </ScrollArea>
    </aside>
  );
};

export default ProgramOutline;
