'use client';

/**
 * BulkAssignDialog — Enterprise-only dialog for assigning a program to multiple
 * clients simultaneously.
 *
 * The trigger button is wrapped in <FeatureGate feature="programBuilder.bulkAssign">
 * so Starter/Professional users see a locked upgrade CTA instead.
 *
 * On submit: POST /api/programs/[id]/bulk-assign with { clientIds, startDate }.
 * Shows inline success/error feedback.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FeatureGate } from '@/components/subscription/FeatureGate';

// ── Types ──────────────────────────────────────────────────────────────────

interface ClientRow {
  id: string;
  email: string;
  displayName?: string;
}

interface BulkAssignResult {
  created: number;
  skipped: number;
  warnings: string[];
}

interface BulkAssignDialogProps {
  programId: string;
  onSuccess?: (result: BulkAssignResult) => void;
}

// ── Inner dialog (rendered only for Enterprise users) ─────────────────────

function BulkAssignDialogInner({ programId, onSuccess }: BulkAssignDialogProps) {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<BulkAssignResult | null>(null);

  // Fetch clients when dialog opens
  const fetchClients = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch('/api/clients?limit=100', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to load clients');
      const json = await res.json();
      const rows: ClientRow[] = (json.data ?? []).map((c: any) => ({
        id: c.id,
        email: c.email,
        displayName: c.userProfile?.firstName
          ? `${c.userProfile.firstName} ${c.userProfile.lastName ?? ''}`.trim()
          : c.email,
      }));
      setClients(rows);
    } catch {
      setClients([]);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setSearch('');
      setError(null);
      setSuccess(null);
      fetchClients();
    }
  }, [open, fetchClients]);

  const filtered = clients.filter((c) =>
    (c.displayName ?? c.email).toLowerCase().includes(search.toLowerCase()),
  );

  const toggleClient = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(`/api/programs/${programId}/bulk-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ clientIds: [...selected], startDate }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          typeof json.error === 'string'
            ? json.error
            : json.error?.message ?? 'Bulk assign failed',
        );
      }

      setSuccess(json.data);
      onSuccess?.(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk assign failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Bulk Assign
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Assign Program</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Success state */}
          {success && (
            <div className="flex items-start gap-2 rounded-md bg-green-50 p-3 text-green-800">
              <CheckCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">
                  Assigned to {success.created} client{success.created !== 1 ? 's' : ''}
                  {success.skipped > 0 && `, ${success.skipped} already assigned`}
                </p>
                {success.warnings.length > 0 && (
                  <ul className="mt-1 text-sm list-disc list-inside text-green-700">
                    {success.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-red-800">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Client list */}
          <div className="max-h-52 overflow-y-auto space-y-1 border rounded-md p-2">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No clients found</p>
            ) : (
              filtered.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-accent cursor-pointer"
                  onClick={(e) => {
                    // Only toggle via the row click, not the checkbox (which fires separately)
                    const target = e.target as HTMLElement;
                    if (target.tagName !== 'INPUT') toggleClient(client.id);
                  }}
                >
                  <Checkbox
                    id={`client-${client.id}`}
                    checked={selected.has(client.id)}
                    onCheckedChange={() => toggleClient(client.id)}
                  />
                  <Label
                    htmlFor={`client-${client.id}`}
                    className="cursor-pointer text-sm font-normal flex-1"
                    onClick={(e) => e.preventDefault()}
                  >
                    {client.displayName ?? client.email}
                  </Label>
                </div>
              ))
            )}
          </div>

          {/* Start date */}
          <div className="space-y-1">
            <Label htmlFor="start-date" className="text-sm font-medium">
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected.size === 0 || isLoading}
          >
            {isLoading ? 'Assigning...' : `Assign to selected (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Public export — wraps the dialog in the Enterprise feature gate ─────────

export function BulkAssignDialog({ programId, onSuccess }: BulkAssignDialogProps) {
  return (
    <FeatureGate feature="programBuilder.bulkAssign">
      <BulkAssignDialogInner programId={programId} onSuccess={onSuccess} />
    </FeatureGate>
  );
}

export default BulkAssignDialog;
