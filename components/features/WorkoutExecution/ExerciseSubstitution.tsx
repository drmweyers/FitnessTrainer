'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Dumbbell, Target, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';

/** Shape of an alternative exercise returned from the API. */
interface AlternativeExercise {
  id: string;
  exerciseId: string;
  name: string;
  gifUrl: string;
  equipment: string;
  targetMuscle: string;
  bodyPart: string;
}

interface ExerciseSubstitutionProps {
  /** exerciseId of the exercise being replaced */
  exerciseId: string;
  /** Display name of the current exercise */
  exerciseName: string;
  /** Called with the new exerciseId when user confirms a swap */
  onSubstitute: (newExerciseId: string) => void;
  /** Called when the modal is dismissed without substituting */
  onClose: () => void;
}

/**
 * ExerciseSubstitution modal.
 * Fetches alternative exercises from the API and lets the user pick one.
 */
const ExerciseSubstitution: React.FC<ExerciseSubstitutionProps> = ({
  exerciseId,
  exerciseName,
  onSubstitute,
  onClose,
}) => {
  const [alternatives, setAlternatives] = useState<AlternativeExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAlternatives() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/exercises/alternatives?exerciseId=${encodeURIComponent(exerciseId)}`);
        if (!res.ok) throw new Error('Failed to fetch alternatives');
        const data = await res.json();
        if (!cancelled) {
          setAlternatives(data.alternatives ?? []);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load alternatives. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAlternatives();
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Swap exercise"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Swap Exercise</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Subheader */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-sm text-gray-600">
            Replacing: <span className="font-medium text-gray-900">{exerciseName}</span>
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <span>Loading alternatives...</span>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && alternatives.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Dumbbell className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>No alternatives found for this exercise.</p>
            </div>
          )}

          {!loading && !error && alternatives.length > 0 && (
            <ul className="space-y-3">
              {alternatives.map((alt) => (
                <li
                  key={alt.exerciseId}
                  data-testid={`alt-${alt.exerciseId}`}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  {/* GIF Preview */}
                  <img
                    src={alt.gifUrl?.startsWith('/') ? alt.gifUrl : `/exerciseGifs/${alt.gifUrl}`}
                    alt={alt.name}
                    className="w-14 h-14 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{alt.name}</p>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Dumbbell className="h-3 w-3" />
                        <span>{alt.equipment}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Target className="h-3 w-3" />
                        <span>{alt.targetMuscle}</span>
                      </span>
                    </div>
                  </div>

                  {/* Select button */}
                  <Button
                    size="sm"
                    onClick={() => onSubstitute(alt.exerciseId)}
                    aria-label={`Use this: ${alt.name}`}
                    className="flex-shrink-0"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Select
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="w-full" aria-label="Cancel">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseSubstitution;
