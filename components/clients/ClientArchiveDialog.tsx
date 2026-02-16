'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ClientArchiveDialogProps {
  clientName: string;
  onConfirm: (reason: string) => void;
  trigger: React.ReactNode;
}

/**
 * ClientArchiveDialog Component
 *
 * Confirmation dialog for archiving a client with reason field.
 * Uses Radix Dialog for accessibility and UX.
 */
export default function ClientArchiveDialog({ clientName, onConfirm, trigger }: ClientArchiveDialogProps) {
  const [reason, setReason] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm(reason);
    setReason(''); // Reset for next time
    setIsOpen(false);
  };

  const handleCancel = () => {
    setReason(''); // Reset on cancel
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive Client</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive <strong className="text-gray-900">{clientName}</strong>? This will hide them from your active clients list.
            You can unarchive them later if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="archive-reason" className="text-sm font-medium text-gray-700">
            Reason (optional)
          </Label>
          <Textarea
            id="archive-reason"
            placeholder="e.g., Client moved, Inactive for 6 months, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            This reason will be saved for your records.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm} className="bg-red-600 hover:bg-red-700">
            Archive Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
