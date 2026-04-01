/**
 * WorkflowRunner - Executes multi-step workflows with actors
 *
 * Orchestrates complex user interactions by running a sequence of workflow steps,
 * maintaining state between steps, and handling errors gracefully.
 */

import { Actor } from './actor';

export interface WorkflowStep {
  name: string;
  execute(context: WorkflowContext): Promise<any>;
}

export class Workflow {
  constructor(public steps: WorkflowStep[]) {}

  addStep(step: WorkflowStep): void {
    this.steps.push(step);
  }
}

export class WorkflowContext {
  private state: Map<string, any> = new Map();
  private actors: Map<string, Actor> = new Map();

  constructor(initialActors: Record<string, Actor> = {}) {
    Object.entries(initialActors).forEach(([role, actor]) => {
      this.actors.set(role, actor);
    });
  }

  /**
   * Store state for cross-step communication
   */
  setState(key: string, value: any): void {
    this.state.set(key, value);
  }

  /**
   * Retrieve previously stored state
   */
  getState(key: string): any {
    return this.state.get(key);
  }

  /**
   * Register an actor for this workflow
   */
  registerActor(role: string, actor: Actor): void {
    this.actors.set(role, actor);
  }

  /**
   * Get an actor by role
   */
  getActor(role?: string): Actor {
    if (role) {
      const actor = this.actors.get(role);
      if (!actor) {
        throw new Error(`Actor with role '${role}' not found in context`);
      }
      return actor;
    }
    // Return the first registered actor if no role specified
    const firstActor = this.actors.values().next().value;
    if (!firstActor) {
      throw new Error('No actors registered in context');
    }
    return firstActor;
  }

  /**
   * Get all registered actors
   */
  getAllActors(): Map<string, Actor> {
    return this.actors;
  }
}

export interface WorkflowResult {
  success: boolean;
  context: WorkflowContext;
  error?: Error;
  completedSteps: string[];
  failedStep?: string;
}

export class WorkflowRunner {
  private onStepStart?: (stepName: string) => void;
  private onStepComplete?: (stepName: string, result: any) => void;
  private onStepError?: (stepName: string, error: Error) => void;

  constructor(options?: {
    onStepStart?: (stepName: string) => void;
    onStepComplete?: (stepName: string, result: any) => void;
    onStepError?: (stepName: string, error: Error) => void;
  }) {
    this.onStepStart = options?.onStepStart;
    this.onStepComplete = options?.onStepComplete;
    this.onStepError = options?.onStepError;
  }

  /**
   * Execute a workflow with the given context
   */
  async run(workflow: Workflow, context: WorkflowContext): Promise<WorkflowResult> {
    const completedSteps: string[] = [];

    for (const step of workflow.steps) {
      try {
        this.onStepStart?.(step.name);

        const result = await step.execute(context);
        context.setState(step.name, result);
        completedSteps.push(step.name);

        this.onStepComplete?.(step.name, result);
      } catch (error) {
        this.onStepError?.(step.name, error as Error);

        return {
          success: false,
          context,
          error: error as Error,
          completedSteps,
          failedStep: step.name,
        };
      }
    }

    return {
      success: true,
      context,
      completedSteps,
    };
  }

  /**
   * Run multiple workflows in parallel
   */
  async runParallel(
    workflows: Array<{ workflow: Workflow; context: WorkflowContext }>
  ): Promise<WorkflowResult[]> {
    return Promise.all(
      workflows.map(({ workflow, context }) => this.run(workflow, context))
    );
  }

  /**
   * Run workflows sequentially
   */
  async runSequential(
    workflows: Array<{ workflow: Workflow; context: WorkflowContext }>
  ): Promise<WorkflowResult[]> {
    const results: WorkflowResult[] = [];

    for (const { workflow, context } of workflows) {
      const result = await this.run(workflow, context);
      results.push(result);

      // Stop on first failure if configured
      if (!result.success) {
        break;
      }
    }

    return results;
  }
}
