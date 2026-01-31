/**
 * ClientAssignment Component
 *
 * Allows trainers to assign a program to a client.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, UserPlus, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface ClientAssignmentProps {
  programId: string;
  programName: string;
  onAssign?: (assignment: {
    clientId: string;
    startDate: Date;
    notes?: string;
  }) => void;
  clients?: Array<{ id: string; name: string; email: string }>;
}

export function ClientAssignment({
  programId,
  programName,
  onAssign,
  clients = [],
}: ClientAssignmentProps) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [assigned, setAssigned] = useState(false);

  const handleSubmit = () => {
    if (!clientId) return;

    onAssign?.({
      clientId,
      startDate,
      notes: notes || undefined,
    });

    setAssigned(true);
    setTimeout(() => {
      setOpen(false);
      setAssigned(false);
      setClientId('');
      setNotes('');
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Assign to Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Program to Client</DialogTitle>
          <DialogDescription>
            Assign "{programName}" to a client with a start date
          </DialogDescription>
        </DialogHeader>

        {assigned ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Successfully Assigned!</h3>
            <p className="text-gray-500 text-center">
              The program has been assigned to your client. They will see it starting{' '}
              {format(startDate, 'MMMM d, yyyy')}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="client">Select Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">No clients available</p>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-xs text-gray-500">{client.email}</p>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'MMMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any instructions or notes for the client..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Program Preview</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  <strong>Program:</strong> {programName}
                </p>
                <p className="text-gray-500">
                  Client will have access to all exercises, workouts, and tracking features
                  from the start date.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={assigned}>
            Cancel
          </Button>
          {!assigned && (
            <Button onClick={handleSubmit} disabled={!clientId}>
              Assign Program
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
