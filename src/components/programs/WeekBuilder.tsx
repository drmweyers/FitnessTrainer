/**
 * WeekBuilder Component
 *
 * Allows adding, editing, and deleting weeks in a program.
 * Supports deload weeks and workout day management.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import type { ProgramWeek } from '@/types/program';

interface WeekBuilderProps {
  weeks: ProgramWeek[];
  onUpdate: (weeks: ProgramWeek[]) => void;
  readOnly?: boolean;
}

export function WeekBuilder({ weeks, onUpdate, readOnly = false }: WeekBuilderProps) {
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newWeek, setNewWeek] = useState({
    weekNumber: weeks.length + 1,
    name: '',
    description: '',
    isDeload: false,
  });

  const handleAddWeek = () => {
    if (!newWeek.name.trim()) return;

    const week: ProgramWeek = {
      id: crypto.randomUUID(),
      ...newWeek,
      workouts: [],
    };

    onUpdate([...weeks, week]);
    setNewWeek({
      weekNumber: weeks.length + 2,
      name: '',
      description: '',
      isDeload: false,
    });
    setDialogOpen(false);
  };

  const handleUpdateWeek = (index: number, updates: Partial<ProgramWeek>) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[index] = { ...updatedWeeks[index], ...updates };
    onUpdate(updatedWeeks);
    setEditingWeek(null);
  };

  const handleDeleteWeek = (index: number) => {
    if (confirm('Are you sure you want to delete this week?')) {
      const updatedWeeks = weeks.filter((_, i) => i !== index);
      // Renumber weeks
      const renumbered = updatedWeeks.map((week, i) => ({
        ...week,
        weekNumber: i + 1,
      }));
      onUpdate(renumbered);
    }
  };

  const moveWeek = (fromIndex: number, toIndex: number) => {
    const updatedWeeks = [...weeks];
    const [moved] = updatedWeeks.splice(fromIndex, 1);
    updatedWeeks.splice(toIndex, 0, moved);
    // Renumber weeks
    const renumbered = updatedWeeks.map((week, i) => ({
      ...week,
      weekNumber: i + 1,
    }));
    onUpdate(renumbered);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Program Weeks</h3>
        {!readOnly && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Week
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Week</DialogTitle>
                <DialogDescription>
                  Create a new week for your program
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="week-name">Week Name *</Label>
                  <Input
                    id="week-name"
                    placeholder="e.g., Week 1 - Foundation"
                    value={newWeek.name}
                    onChange={(e) => setNewWeek({ ...newWeek, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="week-description">Description</Label>
                  <Textarea
                    id="week-description"
                    placeholder="Optional description for this week..."
                    value={newWeek.description}
                    onChange={(e) =>
                      setNewWeek({ ...newWeek, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="deload"
                    checked={newWeek.isDeload}
                    onCheckedChange={(checked) =>
                      setNewWeek({ ...newWeek, isDeload: checked })
                    }
                  />
                  <Label htmlFor="deload">Deload Week</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddWeek}>Add Week</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {weeks.map((week, index) => (
          <WeekCard
            key={week.id}
            week={week}
            index={index}
            totalWeeks={weeks.length}
            onUpdate={(updates) => handleUpdateWeek(index, updates)}
            onDelete={() => handleDeleteWeek(index)}
            onMoveUp={() => index > 0 && moveWeek(index, index - 1)}
            onMoveDown={() => index < weeks.length - 1 && moveWeek(index, index + 1)}
            onEdit={() => setEditingWeek(index)}
            isEditing={editingWeek === index}
            readOnly={readOnly}
          />
        ))}
      </div>

      {weeks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <p className="text-gray-500 mb-4">No weeks added yet</p>
            {!readOnly && (
              <Button onClick={() => setDialogOpen(true)}>Add First Week</Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface WeekCardProps {
  week: ProgramWeek;
  index: number;
  totalWeeks: number;
  onUpdate: (updates: Partial<ProgramWeek>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  isEditing: boolean;
  readOnly: boolean;
}

function WeekCard({
  week,
  index,
  totalWeeks,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onEdit,
  isEditing,
  readOnly,
}: WeekCardProps) {
  const [editValues, setEditValues] = useState({
    name: week.name,
    description: week.description || '',
    isDeload: week.isDeload || false,
  });

  const handleSave = () => {
    onUpdate(editValues);
  };

  return (
    <Card className={week.isDeload ? 'border-orange-200 bg-orange-50/50' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editValues.name}
                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                  placeholder="Week name"
                  autoFocus
                />
                <Textarea
                  value={editValues.description}
                  onChange={(e) =>
                    setEditValues({ ...editValues, description: e.target.value })
                  }
                  placeholder="Description"
                  className="min-h-[60px]"
                />
              </div>
            ) : (
              <>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-gray-500">Week {week.weekNumber}:</span>
                  {week.name}
                  {week.isDeload && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs">
                      Deload
                    </span>
                  )}
                </CardTitle>
                {week.description && (
                  <p className="text-sm text-gray-600 mt-1">{week.description}</p>
                )}
              </>
            )}
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <Button size="icon" variant="ghost" onClick={handleSave}>
                    ✓
                  </Button>
                  <Button size="icon" variant="ghost" onClick={onEdit}>
                    ✕
                  </Button>
                </>
              ) : (
                <>
                  <Button size="icon" variant="ghost" onClick={onMoveUp} disabled={index === 0}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onMoveDown}
                    disabled={index === totalWeeks - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={onEdit}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      {week.workouts && week.workouts.length > 0 && (
        <CardContent>
          <p className="text-sm text-gray-500">
            {week.workouts.length} workout{week.workouts.length !== 1 ? 's' : ''} scheduled
          </p>
        </CardContent>
      )}
    </Card>
  );
}
