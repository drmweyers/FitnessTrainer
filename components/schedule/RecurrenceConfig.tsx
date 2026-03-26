'use client';

/**
 * RecurrenceConfig - Component for configuring recurring appointment schedules
 *
 * Allows trainers to make an appointment recurring by specifying:
 * - Frequency: weekly, biweekly, monthly
 * - End: after N occurrences (default 12)
 * - Preview: shows next 3-5 upcoming dates
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Calendar, ChevronDown } from 'lucide-react';

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface RecurrenceConfigData {
  isRecurring: boolean;
  frequency: RecurrenceFrequency;
  occurrences: number;
}

interface RecurrenceConfigProps {
  /** Called whenever the recurrence config changes; null when recurrence is disabled */
  onConfigChange: (config: RecurrenceConfigData | null) => void;
  /** The start date of the appointment — used to compute preview dates */
  startDate: Date;
}

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 Weeks',
  monthly: 'Monthly',
};

const DEFAULT_OCCURRENCES = 12;
const PREVIEW_COUNT = 5;

/**
 * Compute the next N dates based on frequency and start date
 */
function computePreviewDates(
  startDate: Date,
  frequency: RecurrenceFrequency,
  count: number
): Date[] {
  const dates: Date[] = [];
  let current = new Date(startDate);

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      dates.push(new Date(current));
      continue;
    }

    switch (frequency) {
      case 'weekly':
        current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'biweekly':
        current = new Date(current.getTime() + 14 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly': {
        const next = new Date(current);
        next.setMonth(next.getMonth() + 1);
        current = next;
        break;
      }
    }

    dates.push(new Date(current));
  }

  return dates;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * RecurrenceConfig component
 *
 * Toggle-based component that reveals frequency/occurrence config
 * and a live preview of upcoming dates.
 */
export default function RecurrenceConfig({
  onConfigChange,
  startDate,
}: RecurrenceConfigProps) {
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('weekly');
  const [occurrences, setOccurrences] = useState(DEFAULT_OCCURRENCES);

  const previewDates = isRecurring
    ? computePreviewDates(startDate, frequency, Math.min(PREVIEW_COUNT, occurrences))
    : [];

  // Notify parent when config changes
  useEffect(() => {
    if (isRecurring) {
      onConfigChange({ isRecurring: true, frequency, occurrences });
    } else {
      onConfigChange(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecurring, frequency, occurrences]);

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-3">
        <input
          id="make-recurring"
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label
          htmlFor="make-recurring"
          className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
        >
          <RefreshCw size={14} className="text-gray-400" />
          Make this recurring
        </label>
      </div>

      {/* Config Options (visible when toggled on) */}
      {isRecurring && (
        <div className="pl-7 space-y-4 animate-in slide-in-from-top-2">
          {/* Frequency */}
          <div>
            <label
              htmlFor="recurrence-frequency"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Frequency
            </label>
            <div className="relative">
              <select
                id="recurrence-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {(Object.entries(FREQUENCY_LABELS) as [RecurrenceFrequency, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Occurrences */}
          <div>
            <label
              htmlFor="recurrence-occurrences"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Occurrences
            </label>
            <div className="flex items-center gap-2">
              <input
                id="recurrence-occurrences"
                type="number"
                min={1}
                max={104}
                value={occurrences}
                onChange={(e) =>
                  setOccurrences(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">sessions total</span>
            </div>
          </div>

          {/* Date Preview */}
          {previewDates.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Calendar size={14} />
                Upcoming Dates (next {previewDates.length})
              </p>
              <ul className="space-y-1">
                {previewDates.map((date, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${
                      i === 0
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 bg-gray-50'
                    }`}
                  >
                    <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-medium bg-white border border-current">
                      {i + 1}
                    </span>
                    {formatDate(date)}
                    {i === 0 && (
                      <span className="ml-auto text-xs opacity-70">First session</span>
                    )}
                  </li>
                ))}
              </ul>
              {occurrences > PREVIEW_COUNT && (
                <p className="text-xs text-gray-400 mt-1 pl-1">
                  + {occurrences - PREVIEW_COUNT} more session{occurrences - PREVIEW_COUNT !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
