'use client'

interface ProgressionSuggestionProps {
  suggestion: {
    suggestedWeight: number
    suggestedReps: number
    strategy: string
    reason: string
    confidence: 'high' | 'medium' | 'low'
    dataPoints: number
  }
  currentWeight?: number
  onAccept?: () => void
  onDismiss?: () => void
}

export function ProgressionSuggestion({ suggestion, currentWeight, onAccept, onDismiss }: ProgressionSuggestionProps) {
  // Calculate weight change
  const weightChange = currentWeight ? suggestion.suggestedWeight - currentWeight : 0
  const changeText = weightChange > 0 ? `+${weightChange}` : weightChange < 0 ? `${weightChange}` : '='

  // Confidence badge colors
  const confidenceColors = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-orange-100 text-orange-700',
  }

  // Strategy icon/colors
  const strategyColors: Record<string, string> = {
    increase_weight: 'border-green-200 bg-green-50',
    increase_reps: 'border-blue-200 bg-blue-50',
    maintain: 'border-gray-200 bg-gray-50',
    deload: 'border-yellow-200 bg-yellow-50',
    reduce: 'border-red-200 bg-red-50',
  }

  if (suggestion.dataPoints < 3) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          Log 3+ sets to get progression suggestions.
        </p>
      </div>
    )
  }

  const borderColor = strategyColors[suggestion.strategy] || strategyColors.maintain

  return (
    <div className={`rounded-xl border-2 p-4 ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Next Session Suggestion</h4>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${confidenceColors[suggestion.confidence]}`}>
          {suggestion.confidence} confidence
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-gray-900">{suggestion.suggestedWeight} lbs</span>
        {weightChange !== 0 && (
          <span className={`text-sm font-medium ${weightChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
            ({changeText} lbs)
          </span>
        )}
        <span className="text-lg text-gray-600">x {suggestion.suggestedReps} reps</span>
      </div>

      <p className="text-sm text-gray-600 mb-4">{suggestion.reason}</p>

      <div className="flex gap-2">
        {onAccept && (
          <button
            onClick={onAccept}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Accept
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
