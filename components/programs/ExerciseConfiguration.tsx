/**
 * ExerciseConfiguration Component
 *
 * Configuration for exercise sets including reps, weight, RPE, rest, and tempo.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { ExerciseConfiguration, SetType } from '@/types/program';

interface ExerciseConfigurationProps {
  configurations: ExerciseConfiguration[];
  onUpdate: (configurations: ExerciseConfiguration[]) => void;
  readOnly?: boolean;
}

export function ExerciseConfiguration({
  configurations,
  onUpdate,
  readOnly = false,
}: ExerciseConfigurationProps) {
  const handleAddSet = () => {
    const newSet: ExerciseConfiguration = {
      setNumber: configurations.length + 1,
      setType: 'working',
      reps: '8-12',
      restSeconds: 90,
    };
    onUpdate([...configurations, newSet]);
  };

  const handleUpdateSet = (index: number, updates: Partial<ExerciseConfiguration>) => {
    const updated = [...configurations];
    updated[index] = { ...updated[index], ...updates };
    onUpdate(updated);
  };

  const handleDeleteSet = (index: number) => {
    onUpdate(configurations.filter((_, i) => i !== index));
    // Renumber remaining sets
    const renumbered = configurations
      .filter((_, i) => i !== index)
      .map((set, i) => ({ ...set, setNumber: i + 1 }));
    onUpdate(renumbered);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Sets Configuration</h4>
        {!readOnly && (
          <Button size="sm" onClick={handleAddSet}>
            <Plus className="h-4 w-4 mr-2" />
            Add Set
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {configurations.map((config, index) => (
          <SetConfigurationCard
            key={config.setNumber}
            config={config}
            index={index}
            onUpdate={(updates) => handleUpdateSet(index, updates)}
            onDelete={() => handleDeleteSet(index)}
            readOnly={readOnly}
          />
        ))}
      </div>

      {configurations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-gray-500 mb-4">No sets configured</p>
            {!readOnly && <Button size="sm" onClick={handleAddSet}>Add First Set</Button>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SetConfigurationCardProps {
  config: ExerciseConfiguration;
  index: number;
  onUpdate: (updates: Partial<ExerciseConfiguration>) => void;
  onDelete: () => void;
  readOnly: boolean;
}

function SetConfigurationCard({
  config,
  index,
  onUpdate,
  onDelete,
  readOnly,
}: SetConfigurationCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={expanded ? 'border-blue-300' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {readOnly ? (
            <span className="text-sm font-medium text-gray-500">Set {config.setNumber}</span>
          ) : (
            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
          )}

          <div className="flex-1">
            <Select
              value={config.setType}
              disabled={readOnly}
              onValueChange={(val) => onUpdate({ setType: val as SetType })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warmup">Warm-up</SelectItem>
                <SelectItem value="working">Working</SelectItem>
                <SelectItem value="drop">Drop Set</SelectItem>
                <SelectItem value="pyramid">Pyramid</SelectItem>
                <SelectItem value="amrap">AMRAP</SelectItem>
                <SelectItem value="cluster">Cluster</SelectItem>
                <SelectItem value="rest_pause">Rest-Pause</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!readOnly && (
            <Button size="icon" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▲' : '▼'}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`reps-${index}`}>Reps *</Label>
              <Input
                id={`reps-${index}`}
                placeholder="e.g., 8-12 or 10"
                value={config.reps}
                onChange={(e) => onUpdate({ reps: e.target.value })}
                disabled={readOnly}
              />
            </div>

            <div>
              <Label htmlFor={`weight-${index}`}>Weight Guidance</Label>
              <Input
                id={`weight-${index}`}
                placeholder="e.g., 60% 1RM or RPE 7"
                value={config.weightGuidance || ''}
                onChange={(e) => onUpdate({ weightGuidance: e.target.value })}
                disabled={readOnly}
              />
            </div>

            <div>
              <Label htmlFor={`rest-${index}`}>Rest (seconds)</Label>
              <Input
                id={`rest-${index}`}
                type="number"
                placeholder="90"
                value={config.restSeconds}
                onChange={(e) =>
                  onUpdate({ restSeconds: parseInt(e.target.value) || 0 })
                }
                disabled={readOnly}
              />
            </div>

            <div>
              <Label htmlFor={`rpe-${index}`}>RPE (1-10)</Label>
              <Input
                id={`rpe-${index}`}
                type="number"
                min="1"
                max="10"
                placeholder="7"
                value={config.rpe || ''}
                onChange={(e) => onUpdate({ rpe: parseInt(e.target.value) || undefined })}
                disabled={readOnly}
              />
            </div>

            <div>
              <Label htmlFor={`rir-${index}`}>RIR (0-10)</Label>
              <Input
                id={`rir-${index}`}
                type="number"
                min="0"
                max="10"
                placeholder="2"
                value={config.rir || ''}
                onChange={(e) => onUpdate({ rir: parseInt(e.target.value) || undefined })}
                disabled={readOnly}
              />
            </div>

            <div>
              <Label htmlFor={`tempo-${index}`}>Tempo</Label>
              <Input
                id={`tempo-${index}`}
                placeholder="e.g., 3-0-1-0"
                value={config.tempo || ''}
                onChange={(e) => onUpdate({ tempo: e.target.value })}
                disabled={readOnly}
              />
            </div>
          </div>

          <div>
            <Label htmlFor={`notes-${index}`}>Notes</Label>
            <Textarea
              id={`notes-${index}`}
              placeholder="Additional instructions..."
              value={config.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              disabled={readOnly}
              className="min-h-[60px]"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
