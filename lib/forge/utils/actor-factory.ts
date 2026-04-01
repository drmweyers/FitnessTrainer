/**
 * FORGE Actor Factory - Stream C
 * Creates test actors (trainer, client) for program-workout simulations
 * Uses mocks like existing test suite
 */

export interface Actor {
  id: string;
  email: string;
  role: 'trainer' | 'client' | 'admin';
  fullName: string;
  token?: string;
}

export interface TrainerActor extends Actor {
  role: 'trainer';
  clients: ClientActor[];
  programs: any[];
}

export interface ClientActor extends Actor {
  role: 'client';
  trainerId?: string;
  assignments: any[];
}

export class ActorFactory {
  private static idCounter = 0;

  private static generateId(): string {
    this.idCounter++;
    return `00000000-0000-0000-0000-${String(this.idCounter).padStart(12, '0')}`;
  }

  static async createTrainer(overrides: Partial<Actor> = {}): Promise<TrainerActor> {
    const id = overrides.id || this.generateId();
    const email = overrides.email || `trainer-${id.slice(-6)}@test.com`;

    // Return mock trainer without DB call
    return {
      id,
      email,
      role: 'trainer',
      fullName: 'Test Trainer',
      clients: [],
      programs: [],
    };
  }

  static async createClient(trainerId?: string, overrides: Partial<Actor> = {}): Promise<ClientActor> {
    const id = overrides.id || this.generateId();
    const email = overrides.email || `client-${id.slice(-6)}@test.com`;

    return {
      id,
      email,
      role: 'client',
      fullName: 'Test Client',
      trainerId,
      assignments: [],
    };
  }

  static async createTrainerWithClients(clientCount: number = 2): Promise<TrainerActor> {
    const trainer = await this.createTrainer();

    for (let i = 0; i < clientCount; i++) {
      const client = await this.createClient(trainer.id);
      trainer.clients.push(client);
    }

    return trainer;
  }

  static async cleanup(...actors: Actor[]): Promise<void> {
    // No-op for mock-based tests
    // In real implementation with DB, this would delete created records
  }
}
