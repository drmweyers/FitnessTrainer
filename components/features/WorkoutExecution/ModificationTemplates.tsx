'use client';

import React, { useState } from 'react';
import { Zap, Clock, Battery, AlertTriangle, ChevronUp, X, Settings } from 'lucide-react';
import { Button } from '@/components/shared/Button';

/** Union of all supported modification types. */
export type ModificationType =
  | 'FEELING_GREAT'
  | 'TIME_CRUNCH'
  | 'LOW_ENERGY'
  | 'EQUIPMENT_UNAVAILABLE';

interface Exercise {
  exerciseId: string;
  exerciseName: string;
  category?: string;
  sets: { weight?: number; reps?: number; completed?: boolean }[];
}

interface ModificationTemplatesProps {
  /** Called with the chosen modification type */
  onModify: (template: ModificationType) => void;
  /** Remaining (not yet completed) exercises in the workout */
  remainingExercises: Exercise[];
}

interface Template {
  id: ModificationType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'FEELING_GREAT',
    label: 'Feeling Great',
    description: '+10% weight on all remaining sets',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  {
    id: 'TIME_CRUNCH',
    label: 'Time Crunch',
    description: 'Skip accessory exercises, keep compounds only',
    icon: <Clock className="h-5 w-5" />,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  },
  {
    id: 'LOW_ENERGY',
    label: 'Low Energy',
    description: '-20% weight, keep reps the same',
    icon: <Battery className="h-5 w-5" />,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    id: 'EQUIPMENT_UNAVAILABLE',
    label: 'Equipment Unavailable',
    description: 'Flag current exercise for substitution',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-red-600 bg-red-50 border-red-200',
  },
];

/**
 * ModificationTemplates component.
 * Renders as a floating action button that opens a bottom sheet with
 * quick workout modification presets.
 */
const ModificationTemplates: React.FC<ModificationTemplatesProps> = ({
  onModify,
  remainingExercises,
}) => {
  const [open, setOpen] = useState(false);

  function handleSelect(id: ModificationType) {
    onModify(id);
    setOpen(false);
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Modify workout options"
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Settings className="h-5 w-5" />
        <span className="text-sm font-medium">Adjust Workout</span>
      </button>

      {/* Bottom Sheet Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-white rounded-t-2xl shadow-2xl p-6 pb-safe">
            {/* Sheet Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <ChevronUp className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">Modify Workout</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-1 rounded-md hover:bg-gray-100 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Remaining exercises context */}
            <p className="text-sm text-gray-500 mb-5">
              {remainingExercises.length} exercise{remainingExercises.length !== 1 ? 's' : ''} remaining — choose an adjustment:
            </p>

            {/* Template Options */}
            <div className="space-y-3">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelect(tpl.id)}
                  aria-label={tpl.label}
                  className={`w-full flex items-center space-x-4 p-4 border rounded-xl text-left transition-opacity hover:opacity-90 ${tpl.color}`}
                >
                  <span className="flex-shrink-0">{tpl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{tpl.label}</p>
                    <p className="text-xs mt-0.5 opacity-75">{tpl.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModificationTemplates;
