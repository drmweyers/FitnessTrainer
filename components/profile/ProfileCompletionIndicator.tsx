'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ProfileData {
  bio?: string | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  phone?: string | null;
  timezone?: string | null;
  whatsappNumber?: string | null;
  profilePhotoUrl?: string | null;
}

interface ProfileCompletionIndicatorProps {
  profile: ProfileData;
}

/**
 * ProfileCompletionIndicator Component
 *
 * Shows a visual progress indicator for profile completeness.
 * Calculates percentage based on filled vs total expected fields.
 */
export default function ProfileCompletionIndicator({ profile }: ProfileCompletionIndicatorProps) {
  // Define fields to check
  const fields = [
    { name: 'Bio', value: profile.bio },
    { name: 'Date of Birth', value: profile.dateOfBirth },
    { name: 'Gender', value: profile.gender },
    { name: 'Phone', value: profile.phone },
    { name: 'Timezone', value: profile.timezone },
    { name: 'Profile Photo', value: profile.profilePhotoUrl },
  ];

  const filledFields = fields.filter(field => {
    if (field.value === null || field.value === undefined || field.value === '') {
      return false;
    }
    return true;
  });

  const totalFields = fields.length;
  const completionPercentage = Math.round((filledFields.length / totalFields) * 100);

  // Determine color based on completion
  let colorClass = 'bg-red-500';
  let textColor = 'text-red-600';
  if (completionPercentage >= 80) {
    colorClass = 'bg-green-500';
    textColor = 'text-green-600';
  } else if (completionPercentage >= 50) {
    colorClass = 'bg-yellow-500';
    textColor = 'text-yellow-600';
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Profile Completion</span>
          <span className={`text-lg font-bold ${textColor}`}>{completionPercentage}%</span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full ${colorClass} transition-all duration-300 rounded-full`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Missing Fields */}
        {completionPercentage < 100 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">
              {filledFields.length} of {totalFields} fields completed
            </p>
            <div className="flex flex-wrap gap-1">
              {fields
                .filter(f => !f.value)
                .map((field, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                  >
                    {field.name}
                  </span>
                ))}
            </div>
          </div>
        )}

        {completionPercentage === 100 && (
          <p className="text-xs text-green-600 font-medium">
            Your profile is complete! 🎉
          </p>
        )}
      </CardContent>
    </Card>
  );
}
