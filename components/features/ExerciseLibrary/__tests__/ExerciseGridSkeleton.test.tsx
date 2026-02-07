/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';

import { ExerciseGridSkeleton } from '../ExerciseGridSkeleton';

describe('ExerciseGridSkeleton', () => {
  it('should render grid view skeleton by default', () => {
    const { container } = render(<ExerciseGridSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(container.querySelector('.aspect-video')).toBeInTheDocument();
  });

  it('should render list view skeleton when viewMode is list', () => {
    const { container } = render(<ExerciseGridSkeleton viewMode="list" />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    // List view has a flex row layout with thumbnail
    expect(container.querySelector('.w-16')).toBeInTheDocument();
  });

  it('should not show aspect-video in list view', () => {
    const { container } = render(<ExerciseGridSkeleton viewMode="list" />);
    expect(container.querySelector('.aspect-video')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<ExerciseGridSkeleton className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('should have rounded-xl in grid mode', () => {
    const { container } = render(<ExerciseGridSkeleton viewMode="grid" />);
    expect(container.firstChild).toHaveClass('rounded-xl');
  });

  it('should have rounded-lg in list mode', () => {
    const { container } = render(<ExerciseGridSkeleton viewMode="list" />);
    expect(container.firstChild).toHaveClass('rounded-lg');
  });
});
