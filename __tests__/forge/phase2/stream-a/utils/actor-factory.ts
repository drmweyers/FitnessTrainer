/**
 * FORGE Actor Factory - Stream A
 * Creates test actors (users) for trainer-client workflow simulations
 */

import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export type UserRole = 'trainer' | 'client' | 'admin';

export interface Actor {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  isVerified: boolean;
  token?: string;
  refreshToken?: string;
}

export interface ActorConfig {
  email?: string;
  password?: string;
  role?: UserRole;
  fullName?: string;
  isVerified?: boolean;
}

export class ActorFactory {
  private static idCounter = 0;

  static generateId(): string {
    this.idCounter++;
    return `test-actor-${Date.now()}-${this.idCounter}`;
  }

  static generateEmail(role: UserRole): string {
    const timestamp = Date.now();
    return `forge-${role}-${timestamp}@test.evofit.io`;
  }

  static createTrainer(config: ActorConfig = {}): Actor {
    return {
      id: config.email ? undefined as any : this.generateId(),
      email: config.email || this.generateEmail('trainer'),
      password: config.password || 'TrainerTest123!',
      role: 'trainer',
      fullName: config.fullName || 'Test Trainer',
      isVerified: config.isVerified ?? true,
    };
  }

  static createClient(config: ActorConfig = {}): Actor {
    return {
      id: config.email ? undefined as any : this.generateId(),
      email: config.email || this.generateEmail('client'),
      password: config.password || 'ClientTest123!',
      role: 'client',
      fullName: config.fullName || 'Test Client',
      isVerified: config.isVerified ?? true,
    };
  }

  static createAdmin(config: ActorConfig = {}): Actor {
    return {
      id: config.email ? undefined as any : this.generateId(),
      email: config.email || this.generateEmail('admin'),
      password: config.password || 'AdminTest123!',
      role: 'admin',
      fullName: config.fullName || 'Test Admin',
      isVerified: config.isVerified ?? true,
    };
  }

  static async persistActor(actor: Actor): Promise<Actor> {
    const passwordHash = await bcrypt.hash(actor.password, 12);

    const user = await prisma.user.create({
      data: {
        id: actor.id,
        email: actor.email,
        passwordHash,
        role: actor.role,
        isVerified: actor.isVerified,
        isActive: true,
      },
    });

    actor.id = user.id;
    return actor;
  }

  static async cleanupActor(actorId: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: actorId },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

export default ActorFactory;
