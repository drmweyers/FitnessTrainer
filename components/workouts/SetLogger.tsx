/**
 * SetLogger Component
 *
 * Form for logging exercise sets during a workout.
 * Supports quick increment/decrement, previous best comparison, and notes.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Check, ChevronUp, ChevronDown } from 'lucide-react';

interface SetLoggerProps {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  previousBest?: {
    weight?: number;
    reps?: number;
    volume?: string;
  };
  onLogSet: (setData: {
    exerciseId: string;
    setNumber: number;
    setType: string;
    targetReps: string;
    actualReps: number;
    actualWeight?: number;
    rpe?: number;
    rir?: number;
  }) => void;
  onComplete?: () => void;
  readOnly?: boolean;
}

export function SetLogger({
  exerciseId,
  exerciseName,
  setNumber,
  previousBest,
  onLogSet,
  onComplete,
  readOnly = false,
}: SetLoggerProps) {
  const [targetReps, setTargetReps] = useState('8-12');
  const [actualReps, setActualReps] = useState<number>(0);
  const [weight, setWeight] = useState<string>('');
  const [rpe, setRpe] = useState<number>(7);
  const [rir, setRir] = useState<number>(2);
  const [notes, setNotes] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const handleQuickReps = (delta: number) => {
    const current = parseInt(actualReps.toString()) || 0;
    const newValue = Math.max(0, current + delta);
    setActualReps(newValue);
    if (newValue > 0 && !isComplete) {
      handleComplete();
    }
  };

  const handleQuickWeight = (delta: number) => {
    const current = parseFloat(weight) || 0;
    const newValue = Math.max(0, Math.round((current + delta) * 2) / 2);
    setWeight(newValue.toString());
  };

  const handleComplete = () => {
    if (!readOnly) {
      onLogSet({
        exerciseId,
        setNumber,
        setType: 'working',
        targetReps,
        actualReps,
        actualWeight: weight ? parseFloat(weight) : undefined,
        rpe,
        rir,
      });
      setIsComplete(true);
      onComplete?.();
    }
  };

  const isPersonalRecord =
    previousBest &&
    actualReps > 0 &&
    ((previousBest.reps || 0) < actualReps ||
      (previousBest.weight && weight && parseFloat(weight) > previousBest.weight));

  return (
    <Card className={isComplete ? 'border-green-500 bg-green-50' : ''}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Set {setNumber}</h4>
            <p className="text-sm text-gray-600">{exerciseName}</p>
          </div>
          {isComplete && (
            <Badge className="bg-green-500 text-white">
              <Check className="h-3 w-3 mr-1" />
              Done
            </Badge>
          )}
          {isPersonalRecord && !isComplete && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              🏆 PR
            </Badge>
          )}
        </div>

        {previousBest && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <p>
              <strong>Last time:</strong> {previousBest.reps} reps @ {previousBest.weight}{' '}
              lbs
            </p>
            {previousBest.volume && (
              <p>
                <strong>Volume:</strong> {previousBest.volume}
              </p>
            )}
          </div>
        )}

        {/* Target Reps */}
        <div>
          <Label htmlFor={`target-reps-${setNumber}`}>Target Reps</Label>
          <Input
            id={`target-reps-${setNumber}`}
            placeholder="e.g., 8-12"
            value={targetReps}
            onChange={(e) => setTargetReps(e.target.value)}
            disabled={readOnly || isComplete}
          />
        </div>

        {/* Actual Reps with Quick Controls */}
        <div>
          <Label htmlFor={`actual-reps-${setNumber}`}>Actual Reps *</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleQuickReps(-1)}
              disabled={readOnly || isComplete}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id={`actual-reps-${setNumber}`}
              type="number"
              placeholder="0"
              value={actualReps}
              onChange={(e) => setActualReps(parseInt(e.target.value) || 0)}
              disabled={readOnly || isComplete}
              className="text-center"
              min="0"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleQuickReps(1)}
              disabled={readOnly || isComplete}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              {[5, 10, 12].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActualReps(num);
                    if (!readOnly && num > 0) handleComplete();
                  }}
                  disabled={readOnly || isComplete}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Weight */}
        <div>
          <Label htmlFor={`weight-${setNumber}`}>Weight (lbs)</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleQuickWeight(-5)}
              disabled={readOnly || isComplete}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id={`weight-${setNumber}`}
              type="number"
              placeholder="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              disabled={readOnly || isComplete}
              className="text-center"
              min="0"
              step="2.5"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleQuickWeight(5)}
              disabled={readOnly || isComplete}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* RPE */}
        <div>
          <Label htmlFor={`rpe-${setNumber}`}>RPE (Rate of Perceived Exertion)</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setRpe(Math.max(1, rpe - 1))}
              disabled={readOnly || isComplete}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-2xl font-bold">{rpe}</span>
              <span className="text-sm text-gray-500 ml-2">
                {rpe <= 4
                  ? 'Very Light'
                  : rpe <= 6
                  ? 'Light'
                  : rpe <= 8
                  ? 'Moderate'
                  : 'Heavy'}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setRpe(Math.min(10, rpe + 1))}
              disabled={readOnly || isComplete || rpe >= 10}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* RIR */}
        <div>
          <Label htmlFor={`rir-${setNumber}`}>RIR (Reps in Reserve)</Label>
          <Input
            id={`rir-${setNumber}`}
            type="number"
            placeholder="2"
            value={rir}
            onChange={(e) => setRir(parseInt(e.target.value) || 0)}
            disabled={readOnly || isComplete}
            min="0"
            max="10"
          />
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor={`notes-${setNumber}`}>Notes</Label>
          <Input
            id={`notes-${setNumber}`}
            placeholder="Any notes for this set..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={readOnly || isComplete}
          />
        </div>

        {/* Complete Button */}
        {!readOnly && (
          <Button
            className="w-full"
            onClick={handleComplete}
            disabled={actualReps === 0 || isComplete}
          >
            {isComplete ? '✓ Completed' : 'Complete Set'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
