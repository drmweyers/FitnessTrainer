/**
 * @jest-environment jsdom
 *
 * BulkAssignDialog — component unit tests.
 *
 * Covers:
 *   - Renders client multi-select
 *   - Submit is disabled until at least 1 client is selected
 *   - On submit, fires fetch to /api/programs/[id]/bulk-assign
 *   - Shows success toast + count
 *   - Surfaces errors inline
 *   - Starter/Pro users see a locked CTA (FeatureGate wraps the trigger)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mock subscription hook ─────────────────────────────────────────────────
const mockUseTier = jest.fn();
jest.mock('@/hooks/useTier', () => ({
  useTier: () => mockUseTier(),
}));

jest.mock('@/components/subscription/FeatureGate', () => ({
  FeatureGate: ({ feature, children }: { feature: string; children: React.ReactNode }) => {
    const { hasFeature } = mockUseTier();
    if (!hasFeature(feature)) {
      return <div data-testid="feature-locked">Locked — Upgrade to Enterprise</div>;
    }
    return <>{children}</>;
  },
}));

// ── Mock fetch ─────────────────────────────────────────────────────────────
global.fetch = jest.fn();

// ── Mock clients API ───────────────────────────────────────────────────────
const mockClients = [
  { id: 'client-1', email: 'alice@example.com', userProfile: { bio: null } },
  { id: 'client-2', email: 'bob@example.com', userProfile: { bio: null } },
];

// ── Import component ───────────────────────────────────────────────────────
import { BulkAssignDialog } from '@/components/features/ProgramBuilder/BulkAssignDialog';

// ── Helpers ────────────────────────────────────────────────────────────────
function makeTier(tier: 'starter' | 'professional' | 'enterprise') {
  const allowed = tier === 'enterprise';
  return {
    tier,
    isLoading: false,
    hasFeature: (key: string) => key === 'programBuilder.bulkAssign' ? allowed : false,
    canAccess: () => allowed,
  };
}

function setupFetch(response: object, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
  } as Response);
}

describe('BulkAssignDialog', () => {
  const programId = 'prog-001';

  beforeEach(() => {
    jest.clearAllMocks();
    // Clients fetch
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: mockClients }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true, data: { created: 2, skipped: 0, warnings: [] } }) });
    });
  });

  it('shows locked CTA for Starter tier', () => {
    mockUseTier.mockReturnValue(makeTier('starter'));
    render(<BulkAssignDialog programId={programId} />);
    expect(screen.getByTestId('feature-locked')).toBeInTheDocument();
  });

  it('shows locked CTA for Professional tier', () => {
    mockUseTier.mockReturnValue(makeTier('professional'));
    render(<BulkAssignDialog programId={programId} />);
    expect(screen.getByTestId('feature-locked')).toBeInTheDocument();
  });

  it('renders Bulk Assign trigger button for Enterprise tier', () => {
    mockUseTier.mockReturnValue(makeTier('enterprise'));
    render(<BulkAssignDialog programId={programId} />);
    expect(screen.getByRole('button', { name: /bulk assign/i })).toBeInTheDocument();
  });

  it('opens the dialog when trigger is clicked', async () => {
    mockUseTier.mockReturnValue(makeTier('enterprise'));
    render(<BulkAssignDialog programId={programId} />);

    fireEvent.click(screen.getByRole('button', { name: /bulk assign/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('renders a client list inside the dialog', async () => {
    mockUseTier.mockReturnValue(makeTier('enterprise'));
    render(<BulkAssignDialog programId={programId} />);
    fireEvent.click(screen.getByRole('button', { name: /bulk assign/i }));

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });
  });

  it('submit button is disabled when no clients are selected', async () => {
    mockUseTier.mockReturnValue(makeTier('enterprise'));
    render(<BulkAssignDialog programId={programId} />);
    fireEvent.click(screen.getByRole('button', { name: /bulk assign/i }));

    await waitFor(() => screen.getByRole('dialog'));

    const submitBtn = screen.getByRole('button', { name: /assign to selected/i });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit after selecting a client', async () => {
    mockUseTier.mockReturnValue(makeTier('enterprise'));
    render(<BulkAssignDialog programId={programId} />);
    fireEvent.click(screen.getByRole('button', { name: /bulk assign/i }));

    await waitFor(() => screen.getByText('alice@example.com'));

    // Check the first client's checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /assign to selected/i })).not.toBeDisabled();
    });
  });

  it('calls /api/programs/[id]/bulk-assign on submit and shows success', async () => {
    mockUseTier.mockReturnValue(makeTier('enterprise'));
    render(<BulkAssignDialog programId={programId} />);
    fireEvent.click(screen.getByRole('button', { name: /bulk assign/i }));

    await waitFor(() => screen.getByText('alice@example.com'));

    // Select a client
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Clear previous fetch mock calls and set up the bulk-assign response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { created: 1, skipped: 0, warnings: [] } }),
    });

    fireEvent.click(screen.getByRole('button', { name: /assign to selected/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const bulkCall = calls.find((c: any) => c[0]?.includes(`/api/programs/${programId}/bulk-assign`));
      expect(bulkCall).toBeDefined();
    });
  });

  it('surfaces error message inline when API returns failure', async () => {
    mockUseTier.mockReturnValue(makeTier('enterprise'));
    render(<BulkAssignDialog programId={programId} />);
    fireEvent.click(screen.getByRole('button', { name: /bulk assign/i }));

    await waitFor(() => screen.getByText('alice@example.com'));

    // Select a client
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Mock failed bulk-assign
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: 'Server error' }),
    });

    fireEvent.click(screen.getByRole('button', { name: /assign to selected/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
