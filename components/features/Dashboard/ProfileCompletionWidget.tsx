'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CompletionData {
  completionPercentage: number;
  basicInfo: boolean;
  profilePhoto: boolean;
  healthInfo: boolean;
  goalsSet: boolean;
  measurements: boolean;
}

const CHECKLIST_ITEMS = [
  { key: 'basicInfo', label: 'Basic Information', href: '/profile/edit', description: 'Add bio, date of birth, gender' },
  { key: 'profilePhoto', label: 'Profile Photo', href: '/profile/edit', description: 'Upload a profile picture' },
  { key: 'healthInfo', label: 'Health Information', href: '/profile/health', description: 'Add medical history and health data' },
  { key: 'goalsSet', label: 'Fitness Goals', href: '/analytics', description: 'Set your fitness goals' },
  { key: 'measurements', label: 'Body Measurements', href: '/analytics', description: 'Record your first measurement' },
] as const;

export default function ProfileCompletionWidget() {
  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch('/api/profiles/me', {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data?.profileCompletion) {
          setCompletion(result.data.profileCompletion);
        }
      })
      .catch(err => console.error('Failed to load profile completion:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !completion) {
    return null;
  }

  // Don't show if profile is 100% complete
  if (completion.completionPercentage >= 100) {
    return null;
  }

  const missingItems = CHECKLIST_ITEMS.filter(
    item => !completion[item.key as keyof CompletionData]
  );

  const progressColor = completion.completionPercentage >= 75
    ? 'bg-green-500'
    : completion.completionPercentage >= 50
    ? 'bg-yellow-500'
    : completion.completionPercentage >= 25
    ? 'bg-orange-500'
    : 'bg-red-500';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Complete Your Profile</span>
          <span className="text-2xl font-bold text-blue-600">{completion.completionPercentage}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div
            className={`${progressColor} h-2.5 rounded-full transition-all duration-500`}
            style={{ width: `${completion.completionPercentage}%` }}
          />
        </div>

        {/* Missing Items Checklist */}
        {missingItems.length > 0 && (
          <div className="space-y-2">
            {missingItems.map(item => (
              <Link
                key={item.key}
                href={item.href}
                className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 flex-shrink-0 group-hover:border-blue-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400">{item.description}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}

        {/* Completed Items */}
        {CHECKLIST_ITEMS.filter(item => completion[item.key as keyof CompletionData]).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Completed</p>
            <div className="flex flex-wrap gap-2">
              {CHECKLIST_ITEMS
                .filter(item => completion[item.key as keyof CompletionData])
                .map(item => (
                  <span
                    key={item.key}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50 text-green-700"
                  >
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item.label}
                  </span>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
