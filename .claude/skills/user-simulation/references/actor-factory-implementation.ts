/**
 * ActorFactory - Creates authenticated actors for user simulation testing
 *
 * Usage:
 *   const trainer = await ActorFactory.createActor('trainer');
 *   const client = await ActorFactory.createActor('client');
 *   const admin = await ActorFactory.createActor('admin');
 */

import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth/jwt';
import { Actor } from './actor';

export interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
}

export class ActorFactory {
  private static emailCounter = 0;

  /**
   * Generate a unique email address for test actors
   */
  private static generateEmail(role: string): string {
    this.emailCounter++;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `test-${role}-${timestamp}-${this.emailCounter}-${random}@example.com`;
  }

  /**
   * Create a user in the database
   */
  private static async createUser(data: {
    email: string;
    password: string;
    role: string;
    isActive?: boolean;
    isVerified?: boolean;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        isActive: data.isActive ?? true,
        isVerified: data.isVerified ?? true,
      },
    });

    return user as User;
  }

  /**
   * Authenticate a user and return a token
   */
  private static async authenticate(user: User): Promise<string> {
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    return token;
  }

  /**
   * Create an actor with the specified role
   */
  static async createActor(
    role: string,
    overrides?: Partial<User>
  ): Promise<Actor> {
    const email = overrides?.email ?? this.generateEmail(role);

    const user = await this.createUser({
      email,
      password: 'TestPassword123!',
      role: overrides?.role ?? role,
      isActive: overrides?.isActive,
      isVerified: overrides?.isVerified,
    });

    const token = await this.authenticate(user);

    return new Actor(user, token, role);
  }

  /**
   * Create multiple actors of the same role
   */
  static async createActors(role: string, count: number): Promise<Actor[]> {
    const actors: Actor[] = [];
    for (let i = 0; i < count; i++) {
      actors.push(await this.createActor(role));
    }
    return actors;
  }

  /**
   * Create a trainer-client relationship
   */
  static async createTrainerWithClient(): Promise<{
    trainer: Actor;
    client: Actor;
  }> {
    const trainer = await this.createActor('trainer');
    const client = await this.createActor('client');

    // Create relationship
    await prisma.clientTrainer.create({
      data: {
        clientId: client.user.id,
        trainerId: trainer.user.id,
        status: 'active',
      },
    });

    return { trainer, client };
  }

  /**
   * Clean up actors after tests
   */
  static async cleanup(...actors: Actor[]): Promise<void> {
    for (const actor of actors) {
      try {
        await prisma.user.delete({
          where: { id: actor.user.id },
        });
      } catch (error) {
        // User may already be deleted
        console.warn(`Failed to cleanup user ${actor.user.id}:`, error);
      }
    }
  }
}
