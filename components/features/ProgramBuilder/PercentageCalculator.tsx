'use client';

import React, { useState } from 'react';

interface PercentageCalculatorProps {
  currentWeight: number;
  onApply: (weeklyIncrease: number) => void;
}

const PROJECTION_WEEKS = [4, 8, 12] as const;

/**
 * PercentageCalculator helps trainers plan percentage-based weight progression.
 * Shows a table of projected weights at 4, 8, and 12 weeks based on the
 * selected percentage increase per week.
 */
const PercentageCalculator: React.FC<PercentageCalculatorProps> = ({
  currentWeight,
  onApply,
}) => {
  const [weight, setWeight] = useState<number>(currentWeight);
  const [percentage, setPercentage] = useState<number>(2.5);

  /** Weekly increase in lbs based on percentage */
  const weeklyIncrease = (weight * percentage) / 100;

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setWeight(val);
    }
  };

  const handleApply = () => {
    const increase = (weight * percentage) / 100;
    onApply(increase);
  };

  return (
    <div data-testid="percentage-calculator" className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700">Percentage-Based Increase Calculator</h4>

      <div className="grid grid-cols-2 gap-4">
        {/* Current weight input */}
        <div>
          <label htmlFor="calc-weight" className="block text-sm font-medium text-gray-700 mb-1">
            Current weight (lbs)
          </label>
          <input
            id="calc-weight"
            type="number"
            min="0"
            step="2.5"
            value={weight}
            onChange={handleWeightChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Percentage slider */}
        <div>
          <label htmlFor="calc-percentage" className="block text-sm font-medium text-gray-700 mb-1">
            Weekly increase: <span className="font-semibold text-blue-600">{percentage}%</span>
          </label>
          <input
            id="calc-percentage"
            type="range"
            role="slider"
            min="1"
            max="10"
            step="0.5"
            value={percentage}
            onChange={e => setPercentage(parseFloat(e.target.value))}
            className="w-full mt-1"
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={percentage}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1%</span>
            <span>10%</span>
          </div>
        </div>
      </div>

      {/* Projection table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th scope="col" className="px-3 py-2 text-left font-medium text-gray-600 border border-gray-200">
                Period
              </th>
              <th scope="col" className="px-3 py-2 text-left font-medium text-gray-600 border border-gray-200">
                Projected Weight
              </th>
              <th scope="col" className="px-3 py-2 text-left font-medium text-gray-600 border border-gray-200">
                Total Gain
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border border-gray-200">
              <td className="px-3 py-2 text-gray-500">Start</td>
              <td className="px-3 py-2 font-medium">{weight} lbs</td>
              <td className="px-3 py-2 text-gray-500">—</td>
            </tr>
            {PROJECTION_WEEKS.map(wk => {
              const projected = weight + wk * weeklyIncrease;
              const gain = projected - weight;
              return (
                <tr key={wk} className="border border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-700">{wk} weeks</td>
                  <td className="px-3 py-2 font-medium text-blue-700">
                    {Math.round(projected * 10) / 10} lbs
                  </td>
                  <td className="px-3 py-2 text-green-600">
                    +{Math.round(gain * 10) / 10} lbs
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        Weekly increase: <span className="font-medium">{Math.round(weeklyIncrease * 10) / 10} lbs</span> at {percentage}% of {weight} lbs
      </p>

      <button
        type="button"
        onClick={handleApply}
        className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Apply to Exercise
      </button>
    </div>
  );
};

export default PercentageCalculator;
