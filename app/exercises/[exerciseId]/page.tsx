/**
 * Exercise Detail Page
 * Shows detailed information about a specific exercise
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import Link from 'next/link';

interface Exercise {
  id: string;
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyPart: string;
  equipment: string;
  targetMuscle: string;
  secondaryMuscles: string[];
  instructions: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export default function ExerciseDetailPage() {
  const params = useParams();
  const exerciseId = params.exerciseId as string;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    fetchExercise();
  }, [exerciseId]);

  const fetchExercise = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exercises/by-id/${exerciseId}`);
      if (!response.ok) {
        throw new Error('Exercise not found');
      }
      const data = await response.json();
      setExercise(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercise');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exercise...</p>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Exercise Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This exercise does not exist.'}</p>
          <Link
            href="/exercises"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exercise Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/exercises"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exercise Library
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Exercise GIF */}
          <div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="relative aspect-video bg-gray-100">
                <img
                  src={`https://cdn.jsdelivr.net/gh/FORTRESS-OF-MOINES/Youtube-Thumbnail@main/exerciseDB/${exercise.gifUrl}`}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Exercise+Demo';
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                  isFavorited
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? 'Favorited' : 'Add to Favorites'}
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                <Share2 className="w-5 h-5" />
                Share Exercise
              </button>
            </div>
          </div>

          {/* Exercise Details */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Title and Difficulty */}
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900 flex-1">
                  {exercise.name}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(
                    exercise.difficulty
                  )}`}
                >
                  {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                </span>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">Body Part</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {exercise.bodyPart.charAt(0).toUpperCase() + exercise.bodyPart.slice(1)}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">Equipment</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {exercise.equipment.charAt(0).toUpperCase() + exercise.equipment.slice(1)}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">Target</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {exercise.targetMuscle.charAt(0).toUpperCase() + exercise.targetMuscle.slice(1)}
                  </p>
                </div>
              </div>

              {/* Secondary Muscles */}
              {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">
                    Secondary Muscles
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {exercise.secondaryMuscles.map((muscle) => (
                      <span
                        key={muscle}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Instructions
                </h2>
                <ol className="space-y-3">
                  {exercise.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-sm font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 pt-0.5">{instruction.replace(/^Step:\d+\s*/, '')}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Tips Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Pro Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Focus on proper form over weight or speed</li>
                <li>• Start with lighter weights to master the movement</li>
                <li>• Breathe steadily throughout the exercise</li>
                <li>• Stop if you feel any sharp pain</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
