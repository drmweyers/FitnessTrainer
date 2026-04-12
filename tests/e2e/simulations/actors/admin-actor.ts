/**
 * AdminActor — every action a platform admin can take in EvoFit.
 */
import { Page, expect } from '@playwright/test';
import { BaseActor, ActorCredentials, SIM_ACCOUNTS } from './base-actor';

export class AdminActor extends BaseActor {
  constructor(page: Page, credentials?: ActorCredentials) {
    super(page, credentials || SIM_ACCOUNTS.admin);
  }

  // ═══════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════

  async navigateToDashboard(): Promise<void> {
    await this.goto('/dashboard/admin');
  }

  async navigateToAdminPanel(): Promise<void> {
    await this.goto('/admin');
  }

  async navigateToUsers(): Promise<void> {
    await this.goto('/admin/users');
  }

  async navigateToSystem(): Promise<void> {
    await this.goto('/admin/system');
  }

  // ═══════════════════════════════════════
  // USER MANAGEMENT
  // ═══════════════════════════════════════

  /** List all users via API. */
  async listUsers(filters?: { role?: string; status?: string; search?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const res = await this.apiCall('GET', `/api/admin/users?${params.toString()}`);
    return res.data?.users || res.data || [];
  }

  /** View a specific user's details via API. */
  async viewUser(userId: string): Promise<any> {
    const res = await this.apiCall('GET', `/api/admin/users/${userId}`);
    return res.data;
  }

  /** Update a user via API. */
  async updateUser(userId: string, data: Record<string, any>): Promise<void> {
    await this.apiCall('PUT', `/api/admin/users/${userId}`, data);
  }

  /** Bulk operation on multiple users via API. */
  async bulkUserOperation(userIds: string[], action: string): Promise<void> {
    await this.apiCall('PUT', '/api/admin/users/bulk', { userIds, action });
  }

  // ═══════════════════════════════════════
  // SYSTEM MONITORING
  // ═══════════════════════════════════════

  /** Check system health via API. */
  async checkSystemHealth(): Promise<any> {
    const res = await this.apiCall('GET', '/api/admin/system/health');
    return res.data || res;
  }

  /** Get dashboard metrics via API. */
  async getDashboardMetrics(): Promise<any> {
    const res = await this.apiCall('GET', '/api/admin/dashboard');
    return res.data || res;
  }

  /** View the admin dashboard UI. */
  async viewDashboard(): Promise<void> {
    await this.navigateToDashboard();
    await this.waitForPageReady();
  }

  /** View the admin panel UI. */
  async viewAdminPanel(): Promise<void> {
    await this.navigateToAdminPanel();
    await this.waitForPageReady();
  }

  // ═══════════════════════════════════════
  // FEATURE FLAGS
  // ═══════════════════════════════════════

  /** Get all feature flags via API. */
  async getFeatureFlags(): Promise<any> {
    const res = await this.apiCall('GET', '/api/admin/feature-flags');
    return res.data || res;
  }

  /** Toggle a feature flag via API. */
  async updateFeatureFlag(flagName: string, enabled: boolean): Promise<void> {
    await this.apiCall('PUT', '/api/admin/feature-flags', {
      [flagName]: enabled,
    });
  }

  // ═══════════════════════════════════════
  // ACTIVITY LOG
  // ═══════════════════════════════════════

  /** Get system activity log via API. */
  async getActivityLog(limit?: number): Promise<any[]> {
    const res = await this.apiCall('GET', `/api/admin/activity?limit=${limit || 20}`);
    return res.data?.activities || res.data || [];
  }
}
