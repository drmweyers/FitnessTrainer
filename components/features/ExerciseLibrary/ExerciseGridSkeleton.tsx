'use client'

interface ExerciseGridSkeletonProps {
  viewMode?: 'grid' | 'list'
  className?: string
}

export function ExerciseGridSkeleton({ 
  viewMode = 'grid', 
  className = '' 
}: ExerciseGridSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className={`animate-pulse bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-4">
          {/* Thumbnail skeleton */}
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />

          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            {/* Title */}
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            
            {/* Metadata */}
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
            
            {/* Tags */}
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded-full w-16" />
              <div className="h-6 bg-gray-200 rounded-full w-20" />
              <div className="h-6 bg-gray-200 rounded-full w-12" />
            </div>
          </div>

          {/* Actions skeleton */}
          <div className="flex space-x-1">
            <div className="w-9 h-9 bg-gray-200 rounded-lg" />
            <div className="w-9 h-9 bg-gray-200 rounded-lg" />
            <div className="w-9 h-9 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // Grid view skeleton
  return (
    <div className={`animate-pulse bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`}>
      {/* Image skeleton */}
      <div className="aspect-video bg-gray-200" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded w-4/5" />
        
        {/* Target muscles */}
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
        
        {/* Equipment */}
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        
        {/* Tags */}
        <div className="flex space-x-1">
          <div className="h-6 bg-gray-200 rounded-md w-16" />
          <div className="h-6 bg-gray-200 rounded-md w-20" />
          <div className="h-6 bg-gray-200 rounded-md w-8" />
        </div>
      </div>
    </div>
  )
}