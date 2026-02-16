'use client';

import React from 'react';
import { Camera } from 'lucide-react';

interface PhotoPlaceholderProps {
  existingPhoto?: string | null;
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * PhotoPlaceholder Component
 *
 * Clean placeholder for photo uploads that are deferred post-MVP.
 * Shows existing photo if available, or user initial/icon with "coming soon" text.
 */
export default function PhotoPlaceholder({ existingPhoto, userName, size = 'md' }: PhotoPlaceholderProps) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-xl',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-3xl',
  };

  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  if (existingPhoto) {
    return (
      <div className="flex flex-col items-center">
        <div className={`rounded-full overflow-hidden bg-gray-200 ${sizeClasses[size]}`}>
          <img
            src={existingPhoto}
            alt={userName || 'Profile'}
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">Photo uploads coming soon</p>
      </div>
    );
  }

  const initial = userName ? userName.charAt(0).toUpperCase() : '';

  return (
    <div className="flex flex-col items-center">
      <div className={`rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${sizeClasses[size]}`}>
        {initial ? (
          <div className="bg-blue-600 text-white font-semibold w-full h-full flex items-center justify-center">
            {initial}
          </div>
        ) : (
          <Camera className={`text-gray-400 ${iconSizes[size]}`} />
        )}
      </div>
      <p className="text-xs text-gray-500 text-center mt-2">Photo uploads coming soon</p>
    </div>
  );
}
