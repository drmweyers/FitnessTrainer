'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { UserGoal } from '@/types/analytics';

export default function GoalsTab() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goalType: '',
    targetValue: 0,
    unit: 'kg',
    targetDate: '',
  });

  const { data: goals, isLoading } = useQuery<UserGoal[]>({
    queryKey: ['user-goals'],
    queryFn: () => analyticsApi.getGoals(),
  });

  const createGoalMutation = useMutation({
    mutationFn: (goal: Omit<UserGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentValue'>) =>
      analyticsApi.createGoal(goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-goals'] });
      setShowCreateForm(false);
      setNewGoal({
        goalType: '',
        targetValue: 0,
        unit: 'kg',
        targetDate: '',
      });
    },
  });

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      alert('Please log in to create goals');
      return;
    }

    // Decode token to get userId (simple implementation - in production use proper JWT library)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId || payload.id;

    createGoalMutation.mutate({
      userId,
      goalType: newGoal.goalType,
      targetValue: newGoal.targetValue,
      unit: newGoal.unit,
      startDate: new Date().toISOString().split('T')[0],
      targetDate: newGoal.targetDate,
      status: 'active',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeGoals = goals?.filter(g => g.status === 'active') || [];
  const completedGoals = goals?.filter(g => g.status === 'completed') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Goals</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your progress towards your fitness goals
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Create New Goal'}
        </button>
      </div>

      {/* Create Goal Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Goal</h3>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label htmlFor="goal-type" className="block text-sm font-medium text-gray-700 mb-1">
                Goal Type
              </label>
              <select
                id="goal-type"
                value={newGoal.goalType}
                onChange={e => setNewGoal({ ...newGoal, goalType: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select a goal type</option>
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="strength">Strength</option>
                <option value="endurance">Endurance</option>
                <option value="body_fat">Body Fat Reduction</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="target-value" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Value
                </label>
                <input
                  id="target-value"
                  type="number"
                  step="0.1"
                  value={newGoal.targetValue}
                  onChange={e => setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  value={newGoal.unit}
                  onChange={e => setNewGoal({ ...newGoal, unit: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                  <option value="%">%</option>
                  <option value="reps">reps</option>
                  <option value="minutes">minutes</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="target-date" className="block text-sm font-medium text-gray-700 mb-1">
                Target Date
              </label>
              <input
                id="target-date"
                type="date"
                value={newGoal.targetDate}
                onChange={e => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <button
              type="submit"
              disabled={createGoalMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
            </button>
          </form>
        </div>
      )}

      {/* Empty State */}
      {!goals || goals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
          <p className="text-gray-500 mb-4">Set your first fitness goal to start tracking your progress.</p>
        </div>
      ) : (
        <>
          {/* Active Goals */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Goals</h3>

            {activeGoals.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active goals</p>
            ) : (
              <div className="space-y-4">
                {activeGoals.map(goal => {
                  const progress = (goal.currentValue / goal.targetValue) * 100;
                  const daysRemaining = Math.ceil(
                    (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {goal.goalType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Target: {goal.targetValue} {goal.unit} by{' '}
                            {new Date(goal.targetDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            daysRemaining > 30
                              ? 'bg-green-100 text-green-800'
                              : daysRemaining > 7
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                        </span>
                      </div>

                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-gray-900">
                            {goal.currentValue} / {goal.targetValue} {goal.unit}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">{progress.toFixed(1)}% complete</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed Goals</h3>
              <div className="space-y-3">
                {completedGoals.map(goal => (
                  <div key={goal.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {goal.goalType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Achieved: {goal.currentValue} {goal.unit}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(goal.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
