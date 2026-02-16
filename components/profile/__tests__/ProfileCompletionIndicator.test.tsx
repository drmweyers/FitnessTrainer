/** @jest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileCompletionIndicator from '../ProfileCompletionIndicator';

describe('ProfileCompletionIndicator', () => {
  it('shows 0% for empty profile', () => {
    render(<ProfileCompletionIndicator profile={{}} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows 100% for complete profile', () => {
    const profile = {
      bio: 'Test bio',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      phone: '+1234567890',
      timezone: 'America/New_York',
      profilePhotoUrl: 'https://example.com/photo.jpg',
    };
    render(<ProfileCompletionIndicator profile={profile} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText(/your profile is complete/i)).toBeInTheDocument();
  });

  it('calculates percentage correctly for partial profile', () => {
    const profile = {
      bio: 'Test bio',
      gender: 'female',
      phone: '+1234567890',
    };
    render(<ProfileCompletionIndicator profile={profile} />);
    expect(screen.getByText('50%')).toBeInTheDocument(); // 3 of 6 fields
  });

  it('lists missing fields', () => {
    const profile = {
      bio: 'Test bio',
    };
    render(<ProfileCompletionIndicator profile={profile} />);
    expect(screen.getByText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByText('Gender')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Timezone')).toBeInTheDocument();
    expect(screen.getByText('Profile Photo')).toBeInTheDocument();
  });

  it('uses correct color for low completion', () => {
    const profile = { bio: 'Test' };
    const { container } = render(<ProfileCompletionIndicator profile={profile} />);
    const progressBar = container.querySelector('.bg-red-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('uses correct color for medium completion', () => {
    const profile = {
      bio: 'Test',
      gender: 'male',
      phone: '+1234567890',
    };
    const { container } = render(<ProfileCompletionIndicator profile={profile} />);
    const progressBar = container.querySelector('.bg-yellow-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('uses correct color for high completion', () => {
    const profile = {
      bio: 'Test bio',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      phone: '+1234567890',
      timezone: 'America/New_York',
    };
    const { container } = render(<ProfileCompletionIndicator profile={profile} />);
    const progressBar = container.querySelector('.bg-green-500');
    expect(progressBar).toBeInTheDocument();
  });
});
