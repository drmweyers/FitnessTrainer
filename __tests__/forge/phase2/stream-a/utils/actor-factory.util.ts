/**
 * FORGE Actor Factory - Stream A
 */

export type UserRole = 'trainer' | 'client' | 'admin';

export interface Actor {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  isVerified: boolean;
}

export interface ActorConfig {
  email?: string;
  password?: string;
  role?: UserRole;
  fullName?: string;
  isVerified?: boolean;
}

export class ActorFactory {
  private static counter = 0;

  static generateId(): string {
    this.counter++;
    return `actor-${Date.now()}-${this.counter}`;
  }

  static generateEmail(role: UserRole): string {
    return `forge-${role}-${Date.now()}@test.evofit.io`;
  }

  static createTrainer(config: ActorConfig = {}): Actor {
    return {
      id: this.generateId(),
      email: config.email || this.generateEmail('trainer'),
      password: config.password || 'TrainerTest123!',
      role: 'trainer',
      fullName: config.fullName || 'Test Trainer',
      isVerified: config.isVerified ?? true,
    };
  }

  static createClient(config: ActorConfig = {}): Actor {
    return {
      id: this.generateId(),
      email: config.email || this.generateEmail('client'),
      password: config.password || 'ClientTest123!',
      role: 'client',
      fullName: config.fullName || 'Test Client',
      isVerified: config.isVerified ?? true,
    };
  }

  static createAdmin(config: ActorConfig = {}): Actor {
    return {
      id: this.generateId(),
      email: config.email || this.generateEmail('admin'),
      password: config.password || 'AdminTest123!',
      role: 'admin',
      fullName: config.fullName || 'Test Admin',
      isVerified: config.isVerified ?? true,
    };
  }
}

export default ActorFactory;
