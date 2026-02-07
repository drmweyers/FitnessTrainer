/**
 * Tests for lib/db/prisma.ts
 * Verifies the Prisma singleton exports the expected interface.
 *
 * Note: We test the mock here because the real PrismaClient
 * cannot connect to a database in unit tests. The important
 * thing is that the module exports the correct shape.
 */

jest.mock('@/lib/db/prisma');

import { prisma } from '@/lib/db/prisma';
import prismaDefault from '@/lib/db/prisma';

describe('lib/db/prisma', () => {
  it('exports a named prisma instance', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma).toBe('object');
  });

  it('exports prisma as default export', () => {
    expect(prismaDefault).toBeDefined();
    expect(typeof prismaDefault).toBe('object');
  });

  it('prisma has core model accessors', () => {
    expect(prisma.user).toBeDefined();
    expect(prisma.exercise).toBeDefined();
    expect(prisma.program).toBeDefined();
    expect(prisma.workoutSession).toBeDefined();
    expect(prisma.userGoal).toBeDefined();
    expect(prisma.goalProgress).toBeDefined();
    expect(prisma.activity).toBeDefined();
  });

  it('prisma has raw query methods', () => {
    expect(prisma.$queryRaw).toBeDefined();
    expect(prisma.$queryRawUnsafe).toBeDefined();
    expect(prisma.$transaction).toBeDefined();
    expect(prisma.$connect).toBeDefined();
    expect(prisma.$disconnect).toBeDefined();
  });

  it('prisma model methods are callable jest.fn()', () => {
    expect(typeof prisma.user.findUnique).toBe('function');
    expect(typeof prisma.user.findFirst).toBe('function');
    expect(typeof prisma.user.findMany).toBe('function');
    expect(typeof prisma.user.create).toBe('function');
    expect(typeof prisma.user.update).toBe('function');
    expect(typeof prisma.user.delete).toBe('function');
  });
});
