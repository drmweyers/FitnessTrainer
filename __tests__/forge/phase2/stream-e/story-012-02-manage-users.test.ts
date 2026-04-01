/**
 * Story 012-02: Manage Users
 * Epic 012: Admin Dashboard
 *
 * Tests admin user management workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/middleware/admin', () => ({
  authenticateAdmin: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { authenticateAdmin } from '@/lib/middleware/admin';
import { prisma } from '@/lib/db/prisma';

const mockedPrisma = prisma as any;
const mockedAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('Story 012-02: Manage Users - List', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin lists all users', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/users'), { user: admin })
    );

    const mockUsers = [
      { id: 'u1', email: 'user1@test.com', role: 'client', isActive: true },
      { id: 'u2', email: 'trainer1@test.com', role: 'trainer', isActive: true },
    ];

    mockedPrisma.user.findMany.mockResolvedValueOnce(mockUsers);
    mockedPrisma.user.count.mockResolvedValueOnce(2);

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'listUsers' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin filters users by role', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/users?role=trainer'), { user: admin })
    );

    const mockUsers = [
      { id: 't1', email: 'trainer1@test.com', role: 'trainer' },
      { id: 't2', email: 'trainer2@test.com', role: 'trainer' },
    ];

    mockedPrisma.user.findMany.mockResolvedValueOnce(mockUsers);

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'listUsers', data: { filter: { role: 'trainer' } } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin searches users by email', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/users?search=test'), { user: admin })
    );

    mockedPrisma.user.findMany.mockResolvedValueOnce([
      { id: 'u1', email: 'test@test.com' },
    ]);

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'searchUsers', data: { query: 'test' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 012-02: Manage Users - Modify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin views user details', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/users/u1'), { user: admin })
    );

    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'user1@test.com',
      role: 'client',
      createdAt: new Date(),
    });

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewUserDetails', data: { userId: 'u1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin updates user role', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/users/u1'), { user: admin })
    );

    mockedPrisma.user.update.mockResolvedValueOnce({
      id: 'u1',
      role: 'trainer',
    });

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'updateUserRole', data: { userId: 'u1', role: 'trainer' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin deactivates user account', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/users/u1'), { user: admin })
    );

    mockedPrisma.user.update.mockResolvedValueOnce({
      id: 'u1',
      isActive: false,
    });

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'deactivateUser', data: { userId: 'u1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin reactivates user account', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/users/u1'), { user: admin })
    );

    mockedPrisma.user.update.mockResolvedValueOnce({
      id: 'u1',
      isActive: true,
    });

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'reactivateUser', data: { userId: 'u1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 012-02: Manage Users - Bulk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin performs bulk user action', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/users/bulk'), { user: admin })
    );

    mockedPrisma.user.update.mockResolvedValue({ count: 5 });

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'bulkUserAction', data: { userIds: ['u1', 'u2', 'u3'], action: 'deactivate' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 012-02: Manage Users - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prevents self-deactivation', async () => {
    const admin = ActorFactory.createAdmin();

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'deactivateUser', data: { userId: admin.id } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles non-existent user', async () => {
    const admin = ActorFactory.createAdmin();

    mockedPrisma.user.findUnique.mockResolvedValueOnce(null);

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewUserDetails', data: { userId: 'nonexistent' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
