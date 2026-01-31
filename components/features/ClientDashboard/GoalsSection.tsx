'use client'

import { useState } from 'react'
import { CheckCircle, Circle, Plus, Target } from 'lucide-react'

interface GoalsSectionProps {
  goals: Array<{
    id: string
    text: string
    completed: boolean
  }>
}

export default function GoalsSection({ goals }: GoalsSectionProps) {
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [newGoal, setNewGoal] = useState('')
  
  const handleAddGoal = () => {
    // In a real app, this would call an API to save the goal
    setNewGoal('')
    setIsAddingGoal(false)
  }
  
  const completedGoals = goals.filter(goal => goal.completed).length
  const totalGoals = goals.length
  const progressPercentage = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Client Goals</h3>
        <button 
          className="text-blue-600 text-xs flex items-center"
          onClick={() => setIsAddingGoal(true)}
        >
          <Plus size={14} className="mr-1" />
          Add Goal
        </button>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{completedGoals}/{totalGoals} completed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {isAddingGoal && (
        <div className="mb-3 border border-gray-200 rounded-md p-2">
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter goal..."
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button 
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
              onClick={() => setIsAddingGoal(false)}
            >
              Cancel
            </button>
            <button 
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md"
              onClick={handleAddGoal}
              disabled={!newGoal.trim()}
            >
              Save
            </button>
          </div>
        </div>
      )}
      
      {goals.length === 0 ? (
        <div className="text-center py-4">
          <Target size={20} className="mx-auto text-gray-400 mb-1" />
          <p className="text-gray-500 text-xs">No goals set yet</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {goals.map(goal => (
            <li key={goal.id} className="flex items-start">
              {goal.completed ? (
                <CheckCircle size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              ) : (
                <Circle size={16} className="text-gray-300 mt-0.5 mr-2 flex-shrink-0" />
              )}
              <span className={`text-sm ${goal.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                {goal.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}