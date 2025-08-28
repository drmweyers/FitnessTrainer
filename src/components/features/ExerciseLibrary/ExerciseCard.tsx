'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Heart, 
  Play, 
  Pause, 
  Info, 
  MoreVertical,
  Star,
  Clock,
  Dumbbell,
  Target,
  Plus
} from 'lucide-react'
import { ExerciseWithUserData } from '@/types/exercise'

interface ExerciseCardProps {
  exercise: ExerciseWithUserData
  viewMode?: 'grid' | 'list'
  onFavorite?: (exerciseId: string) => void
  onAddToCollection?: (exerciseId: string) => void
  onQuickView?: (exercise: ExerciseWithUserData) => void
  className?: string
}

export function ExerciseCard({ 
  exercise, 
  viewMode = 'grid',
  onFavorite,
  onAddToCollection,
  onQuickView,
  className = ''
}: ExerciseCardProps) {
  const [isGifPlaying, setIsGifPlaying] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout>()
  const imageRef = useRef<HTMLImageElement>(null)

  // Auto-play GIF on hover (with delay)
  useEffect(() => {
    if (isHovering) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsGifPlaying(true)
      }, 300) // 300ms delay before starting GIF
    } else {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      setIsGifPlaying(false)
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [isHovering])

  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    setShowActions(false)
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFavorite?.(exercise.exerciseId)
  }

  const handleAddToCollection = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCollection?.(exercise.exerciseId)
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(exercise)
  }

  const getGifPath = () => {
    return `/exerciseGifs/${exercise.gifUrl}`
  }

  const getStaticImagePath = () => {
    // Use first frame of GIF or a placeholder
    return imageError ? '/images/exercise-placeholder.jpg' : getGifPath()
  }

  if (viewMode === 'list') {
    return (
      <Link href={`/dashboard/exercises/${exercise.exerciseId}`}>
        <div 
          className={`group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center space-x-4">
            {/* Thumbnail */}
            <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                ref={imageRef}
                src={isGifPlaying && !imageError ? getGifPath() : getStaticImagePath()}
                alt={exercise.name}
                fill
                className={`object-cover transition-all duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                unoptimized={isGifPlaying} // Allow GIF animation
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {isGifPlaying && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>

            {/* Exercise Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {exercise.name}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Target size={14} className="mr-1" />
                      {exercise.targetMuscles.slice(0, 2).join(', ')}
                      {exercise.targetMuscles.length > 2 && ` +${exercise.targetMuscles.length - 2}`}
                    </div>
                    <div className="flex items-center">
                      <Dumbbell size={14} className="mr-1" />
                      {exercise.equipments.join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    {exercise.bodyParts.slice(0, 3).map((bodyPart) => (
                      <span
                        key={bodyPart}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {bodyPart}
                      </span>
                    ))}
                    {exercise.bodyParts.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{exercise.bodyParts.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 ml-4">
                  <button
                    onClick={handleFavorite}
                    className={`p-2 rounded-lg transition-colors ${
                      exercise.isFavorited 
                        ? 'text-red-500 hover:text-red-600' 
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart size={18} fill={exercise.isFavorited ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={handleQuickView}
                    className="p-2 text-gray-400 hover:text-blue-500 rounded-lg transition-colors"
                  >
                    <Info size={18} />
                  </button>
                  <button
                    onClick={handleAddToCollection}
                    className="p-2 text-gray-400 hover:text-green-500 rounded-lg transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Grid view
  return (
    <Link href={`/dashboard/exercises/${exercise.exerciseId}`}>
      <div 
        className={`group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image Container */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden">
          <Image
            ref={imageRef}
            src={isGifPlaying && !imageError ? getGifPath() : getStaticImagePath()}
            alt={exercise.name}
            fill
            className={`object-cover transition-all duration-300 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            unoptimized={isGifPlaying} // Allow GIF animation
          />

          {/* Loading State */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* GIF Playing Indicator */}
          {isGifPlaying && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center space-x-1 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
                <Play size={12} />
                <span>GIF</span>
              </div>
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleFavorite}
            className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
              exercise.isFavorited
                ? 'bg-red-500 text-white' 
                : 'bg-white bg-opacity-80 text-gray-600 hover:bg-red-500 hover:text-white'
            } ${isHovering ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          >
            <Heart size={16} fill={exercise.isFavorited ? 'currentColor' : 'none'} />
          </button>

          {/* Quick Actions Overlay */}
          <div 
            className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-all duration-200 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center space-x-3">
              <button
                onClick={handleQuickView}
                className="p-3 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 rounded-full transition-all duration-200 hover:scale-110"
              >
                <Info size={20} />
              </button>
              <button
                onClick={handleAddToCollection}
                className="p-3 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 rounded-full transition-all duration-200 hover:scale-110"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-lg leading-tight">
              {exercise.name}
            </h3>
            {exercise.usageCount && exercise.usageCount > 0 && (
              <div className="flex items-center text-gray-400 text-sm ml-2">
                <Clock size={14} className="mr-1" />
                {exercise.usageCount}
              </div>
            )}
          </div>

          {/* Target Muscles */}
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <Target size={14} className="mr-2 text-gray-400" />
            <span className="truncate">
              {exercise.targetMuscles.slice(0, 2).join(', ')}
              {exercise.targetMuscles.length > 2 && ` +${exercise.targetMuscles.length - 2}`}
            </span>
          </div>

          {/* Equipment */}
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <Dumbbell size={14} className="mr-2 text-gray-400" />
            <span className="truncate">{exercise.equipments.join(', ')}</span>
          </div>

          {/* Body Parts Tags */}
          <div className="flex flex-wrap gap-1">
            {exercise.bodyParts.slice(0, 2).map((bodyPart) => (
              <span
                key={bodyPart}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium"
              >
                {bodyPart}
              </span>
            ))}
            {exercise.bodyParts.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                +{exercise.bodyParts.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}