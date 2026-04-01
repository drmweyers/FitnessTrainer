/**
 * Actor - Represents a simulated user with authentication state
 *
 * An Actor encapsulates a user's identity, authentication token, and role,
 * along with state management for multi-step workflows.
 */

export interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
}

export class Actor {
  private state: Map<string, any> = new Map();

  constructor(
    public user: User,
    public token: string,
    public role: string
  ) {}

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
   * Check if state key exists
   */
  hasState(key: string): boolean {
    return this.state.has(key);
  }

  /**
   * Clear all state
   */
  clearState(): void {
    this.state.clear();
  }

  /**
   * Create an authenticated request for this actor
   */
  authenticatedRequest(
    method: string,
    path: string,
    body?: any
  ): Request {
    const url = path.startsWith('http')
      ? path
      : `${process.env.TEST_BASE_URL || 'http://localhost:3000'}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };

    return new Request(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Get headers for authenticated requests (for fetch API)
   */
  getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }
}
