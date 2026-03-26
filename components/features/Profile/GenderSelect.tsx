'use client';

import React from 'react';
import { Label } from '@/components/ui/label';

/**
 * Gender options supported by EvoFit profile.
 */
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-Binary' },
  { value: 'prefer-not-to-say', label: 'Prefer Not To Say' },
] as const;

export type GenderValue = typeof GENDER_OPTIONS[number]['value'] | '';

interface GenderSelectProps {
  /** Current selected gender value */
  value: GenderValue;
  /** Callback fired with the new gender value on change */
  onChange: (value: GenderValue) => void;
  /** Optional CSS class for the container div */
  className?: string;
}

/**
 * GenderSelect — labelled native <select> for gender field in user profiles.
 * Provides four standardised options: male, female, non-binary, prefer-not-to-say.
 */
export default function GenderSelect({ value, onChange, className }: GenderSelectProps) {
  return (
    <div className={className}>
      <Label htmlFor="gender">Gender</Label>
      <select
        id="gender"
        value={value}
        onChange={e => onChange(e.target.value as GenderValue)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
      >
        <option value="">Select gender</option>
        {GENDER_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
