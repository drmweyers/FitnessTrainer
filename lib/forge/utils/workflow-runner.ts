/**
 * FORGE Workflow Runner - Stream C
 * Executes multi-step trainer-client workflows with state tracking
 * Uses mocks like existing test suite
 */

import { Actor, TrainerActor, ClientActor } from './actor-factory';

export interface WorkflowStep {
  action: string;
  data?: any;
  expectedOutcome?: 'success' | 'failure' | 'partial';
}

export interface WorkflowContext {
  actor: Actor;
  state: Record<string, any>;
  results: WorkflowResult[];
  errors: WorkflowError[];
}

export interface WorkflowResult {
  step: number;
  action: string;
  success: boolean;
  data?: any;
  durationMs: number;
}

export interface WorkflowError {
  step: number;
  action: string;
  error: string;
  timestamp: Date;
}

export interface WorkflowOptions {
  continueOnError?: boolean;
  timeoutMs?: number;
  validateEachStep?: boolean;
}

export class WorkflowRunner {
  static async run(options: {
    actor: Actor;
    steps: WorkflowStep[];
    options?: WorkflowOptions;
  }): Promise<{
    success: boolean;
    completedSteps: number;
    totalSteps: number;
    results: WorkflowResult[];
    errors: WorkflowError[];
    finalState: Record<string, any>;
  }> {
    const { actor, steps, options: opts = {} } = options;
    const { continueOnError = false, timeoutMs = 30000 } = opts;

    const context: WorkflowContext = {
      actor,
      state: {},
      results: [],
      errors: [],
    };

    let completedSteps = 0;
    const startTime = Date.now();

    for (let i = 0; i < steps.length; i++) {
      if (Date.now() - startTime > timeoutMs) {
        context.errors.push({
          step: i,
          action: steps[i].action,
          error: 'Workflow timeout exceeded',
          timestamp: new Date(),
        });
        break;
      }

      const step = steps[i];
      const stepStart = Date.now();

      try {
        const result = await this.executeStep(step, context, i);
        context.results.push({
          step: i,
          action: step.action,
          success: true,
          data: result,
          durationMs: Date.now() - stepStart,
        });
        completedSteps++;

        // Validate expected outcome
        if (step.expectedOutcome === 'failure') {
          context.errors.push({
            step: i,
            action: step.action,
            error: 'Expected failure but step succeeded',
            timestamp: new Date(),
          });
          if (!continueOnError) break;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        context.errors.push({
          step: i,
          action: step.action,
          error: errorMsg,
          timestamp: new Date(),
        });

        context.results.push({
          step: i,
          action: step.action,
          success: false,
          durationMs: Date.now() - stepStart,
        });

        if (step.expectedOutcome !== 'failure' && !continueOnError) {
          break;
        }
      }
    }

    return {
      success: context.errors.length === 0 || (continueOnError && completedSteps > 0),
      completedSteps,
      totalSteps: steps.length,
      results: context.results,
      errors: context.errors,
      finalState: context.state,
    };
  }

  private static async executeStep(
    step: WorkflowStep,
    context: WorkflowContext,
    stepIndex: number
  ): Promise<any> {
    const { action, data } = step;

    switch (action) {
      case 'createProgram':
        return this.createProgram(context, data);
      case 'createWeek':
        return this.createWeek(context, data);
      case 'createWorkout':
        return this.createWorkout(context, data);
      case 'addExercise':
        return this.addExercise(context, data);
      case 'configureSets':
        return this.configureSets(context, data);
      case 'assignProgram':
        return this.assignProgram(context, data);
      case 'startWorkout':
        return this.startWorkout(context, data);
      case 'logSet':
        return this.logSet(context, data);
      case 'completeWorkout':
        return this.completeWorkout(context, data);
      case 'createSuperset':
        return this.createSuperset(context, data);
      case 'applyTemplate':
        return this.applyTemplate(context, data);
      case 'setProgression':
        return this.setProgression(context, data);
      case 'modifyExercise':
        return this.modifyExercise(context, data);
      case 'skipExercise':
        return this.skipExercise(context, data);
      case 'substituteExercise':
        return this.substituteExercise(context, data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private static async createProgram(context: WorkflowContext, data: any): Promise<any> {
    if (context.actor.role !== 'trainer') {
      throw new Error('Only trainers can create programs');
    }

    const program = {
      id: 'prog-' + Date.now(),
      name: data.name,
      description: data.description,
      trainerId: context.actor.id,
      difficulty: data.difficulty || 'beginner',
      durationWeeks: data.durationWeeks || 4,
      isTemplate: data.isTemplate || false,
      createdAt: new Date(),
    };

    context.state.programId = program.id;
    context.state.program = program;
    return program;
  }

  private static async createWeek(context: WorkflowContext, data: any): Promise<any> {
    const programId = context.state.programId || data.programId;
    if (!programId) throw new Error('No program in context');

    const week = {
      id: 'week-' + Date.now(),
      programId,
      weekNumber: data.weekNumber,
      name: data.name || `Week ${data.weekNumber}`,
      createdAt: new Date(),
    };

    context.state.weekId = week.id;
    context.state.week = week;
    return week;
  }

  private static async createWorkout(context: WorkflowContext, data: any): Promise<any> {
    const weekId = context.state.weekId || data.weekId;
    if (!weekId) throw new Error('No week in context');

    const workout = {
      id: 'workout-' + Date.now(),
      weekId,
      name: data.name,
      dayNumber: data.dayNumber,
      description: data.description,
      estimatedDuration: data.estimatedDuration,
      createdAt: new Date(),
    };

    context.state.workoutId = workout.id;
    context.state.workout = workout;
    return workout;
  }

  private static async addExercise(context: WorkflowContext, data: any): Promise<any> {
    const workoutId = context.state.workoutId || data.workoutId;
    if (!workoutId) throw new Error('No workout in context');

    const workoutExercise = {
      id: 'we-' + Date.now(),
      workoutId,
      exerciseId: data.exerciseId,
      orderIndex: data.orderIndex || 0,
      supersetGroup: data.supersetGroup,
      notes: data.notes,
      createdAt: new Date(),
    };

    context.state.exerciseId = workoutExercise.id;
    context.state.exercise = workoutExercise;
    return workoutExercise;
  }

  private static async configureSets(context: WorkflowContext, data: any): Promise<any> {
    const exerciseId = context.state.exerciseId || data.exerciseId;
    if (!exerciseId) throw new Error('No exercise in context');

    const configs = [];
    for (let i = 0; i < data.sets; i++) {
      const config = {
        id: 'config-' + Date.now() + '-' + i,
        workoutExerciseId: exerciseId,
        setNumber: i + 1,
        setType: data.setType || 'working',
        reps: data.reps,
        weightGuidance: data.weightGuidance,
        restSeconds: data.restSeconds,
        tempo: data.tempo,
        rpe: data.rpe,
        createdAt: new Date(),
      };
      configs.push(config);
    }

    context.state.configs = configs;
    return configs;
  }

  private static async assignProgram(context: WorkflowContext, data: any): Promise<any> {
    const programId = context.state.programId || data.programId;
    if (!programId) throw new Error('No program in context');

    const assignment = {
      id: 'assign-' + Date.now(),
      programId,
      clientId: data.clientId,
      trainerId: context.actor.id,
      startDate: data.startDate || new Date(),
      isActive: true,
      createdAt: new Date(),
    };

    context.state.assignmentId = assignment.id;
    context.state.assignment = assignment;
    return assignment;
  }

  private static async startWorkout(context: WorkflowContext, data: any): Promise<any> {
    const session = {
      id: 'session-' + Date.now(),
      userId: context.actor.id,
      workoutId: data.workoutId,
      status: 'in_progress',
      startedAt: new Date(),
    };

    context.state.sessionId = session.id;
    context.state.session = session;
    return session;
  }

  private static async logSet(context: WorkflowContext, data: any): Promise<any> {
    const sessionId = context.state.sessionId;
    if (!sessionId) throw new Error('No workout session in context');

    const setLog = {
      id: 'set-' + Date.now(),
      exerciseLogId: data.exerciseLogId,
      setNumber: data.setNumber,
      performedReps: data.reps,
      performedWeight: data.weight,
      weightUnit: data.unit || 'lb',
      rpe: data.rpe,
      isWarmup: data.isWarmup || false,
      isFailed: data.isFailed || false,
      completedAt: new Date(),
    };

    return setLog;
  }

  private static async completeWorkout(context: WorkflowContext, data: any): Promise<any> {
    const sessionId = context.state.sessionId || data.sessionId;
    if (!sessionId) throw new Error('No workout session in context');

    const session = {
      id: sessionId,
      status: 'completed',
      completedAt: new Date(),
      duration: data.duration,
      notes: data.notes,
    };

    context.state.session = session;
    return session;
  }

  private static async createSuperset(context: WorkflowContext, data: any): Promise<any> {
    const { exerciseIds, groupId } = data;

    // Mock updating exercises with superset group
    const updated = exerciseIds.map((id: string) => ({
      id,
      supersetGroup: groupId,
    }));

    return { groupId, exerciseIds, updated };
  }

  private static async applyTemplate(context: WorkflowContext, data: any): Promise<any> {
    // Template application logic - mock
    const program = {
      id: 'prog-' + Date.now(),
      name: data.name || 'Program from Template',
      difficulty: data.difficulty || 'intermediate',
      durationWeeks: data.durationWeeks || 8,
      basedOnTemplateId: data.basedOnTemplateId,
      createdAt: new Date(),
    };

    context.state.program = program;
    context.state.programId = program.id;
    return { templateId: data.templateId, applied: true, program };
  }

  private static async setProgression(context: WorkflowContext, data: any): Promise<any> {
    const programId = context.state.programId || data.programId;
    if (!programId) throw new Error('No program in context');

    const progression = {
      id: 'prog-' + Date.now(),
      programId,
      progressionType: data.type,
      weightIncreasePercentage: data.weightIncrease,
      deloadFrequency: data.deloadFrequency,
      blocks: data.blocks,
      createdAt: new Date(),
    };

    context.state.progression = progression;
    return progression;
  }

  private static async modifyExercise(context: WorkflowContext, data: any): Promise<any> {
    const modification = {
      id: 'mod-' + Date.now(),
      sessionId: context.state.sessionId,
      exerciseId: data.exerciseId,
      modificationType: data.type,
      originalValue: data.original,
      modifiedValue: data.modified,
      reason: data.reason,
      createdAt: new Date(),
    };

    return modification;
  }

  private static async skipExercise(context: WorkflowContext, data: any): Promise<any> {
    return this.modifyExercise(context, {
      exerciseId: data.exerciseId,
      type: 'skipped',
      original: { included: true },
      modified: { included: false },
      reason: data.reason,
    });
  }

  private static async substituteExercise(context: WorkflowContext, data: any): Promise<any> {
    return this.modifyExercise(context, {
      exerciseId: data.exerciseId,
      type: 'exercise_sub',
      original: { exerciseId: data.originalExerciseId },
      modified: { exerciseId: data.newExerciseId },
      reason: data.reason,
    });
  }
}
