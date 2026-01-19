'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Heart, 
  Play, 
  Info, 
  Plus,
  Target,
  Dumbbell,
  Clock,
  ChevronRight,
  Star
} from 'lucide-react'
import { ExerciseWithUserData } from '@/types/exercise'
import { useTouchGestures, useIsMobile, useTouchFriendlyStyles } from '@/hooks/useTouchGestures'

interface ExerciseCardMobileProps {
  exercise: ExerciseWithUserData
  viewMode?: 'grid' | 'list'
  onFavorite?: (exerciseId: string) => void
  onAddToCollection?: (exerciseId: string) => void
  onQuickView?: (exercise: ExerciseWithUserData) => void
  enableSwipeActions?: boolean
  className?: string
}

interface SwipeAction {
  icon: React.ReactNode
  color: string
  action: () => void
}

export default function ExerciseCardMobile({ 
  exercise, 
  viewMode = 'grid',
  onFavorite,
  onAddToCollection,
  onQuickView,
  enableSwipeActions = true,
  className = ''
}: ExerciseCardMobileProps) {
  const [isGifPlaying, setIsGifPlaying] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showSwipeActions, setShowSwipeActions] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  
  const isMobile = useIsMobile()
  const touchStyles = useTouchFriendlyStyles()
  const cardRef = useRef<HTMLDivElement>(null)
  const _swipeStartX = useRef<number>(0)
  const maxSwipeOffset = 120 // Maximum swipe distance to reveal actions

  // Swipe actions for mobile
  const swipeActions: SwipeAction[] = [
    {
      icon: <Heart size={20} fill={exercise.isFavorited ? 'currentColor' : 'none'} />,
      color: exercise.isFavorited ? 'bg-red-500' : 'bg-gray-500',
      action: () => onFavorite?.(exercise.id)
    },
    {
      icon: <Plus size={20} />,
      color: 'bg-blue-500',
      action: () => onAddToCollection?.(exercise.id)
    },
    {
      icon: <Info size={20} />,
      color: 'bg-green-500',
      action: () => onQuickView?.(exercise)
    }
  ]

  // Touch gesture handlers
  const gestureRef = useTouchGestures({
    onTap: () => {
      if (isMobile && showSwipeActions) {
        // Hide swipe actions on tap
        setShowSwipeActions(false)
        setSwipeOffset(0)
      }
    },
    onSwipeLeft: () => {
      if (isMobile && enableSwipeActions && !showSwipeActions) {
        setShowSwipeActions(true)
        setSwipeOffset(-maxSwipeOffset)
      }
    },
    onSwipeRight: () => {
      if (isMobile && showSwipeActions) {
        setShowSwipeActions(false)
        setSwipeOffset(0)
      }
    },
    onLongPress: () => {
      if (isMobile) {
        // Toggle GIF on long press
        setIsGifPlaying(prev => !prev)
      }
    }
  }, {
    swipe: { minDistance: 30, maxTime: 400 },
    tap: { maxDelay: 300 }
  })

  const handleFavorite = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFavorite?.(exercise.id)
    
    if (isMobile) {
      // Hide swipe actions after action
      setShowSwipeActions(false)
      setSwipeOffset(0)
    }
  }

  const handleAddToCollection = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCollection?.(exercise.id)
    
    if (isMobile) {
      setShowSwipeActions(false)
      setSwipeOffset(0)
    }
  }

  const handleQuickView = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(exercise)
    
    if (isMobile) {
      setShowSwipeActions(false)
      setSwipeOffset(0)
    }
  }

  const getGifPath = () => {
    return `/exerciseGifs/${exercise.gifUrl}`
  }

  const getStaticImagePath = () => {
    return imageError ? '/images/exercise-placeholder.jpg' : getGifPath()
  }

  // Auto-play GIF on mobile hover equivalent (long press)
  useEffect(() => {
    if (!isMobile) {
      // Regular hover behavior for desktop
      return
    }
  }, [isMobile])

  // Combine refs
  const setRefs = (node: HTMLDivElement | null) => {
    if (node) {
      // cardRef is mutable
      (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      if (typeof gestureRef === 'object' && gestureRef !== null) {
        (gestureRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    }
  }

  if (viewMode === 'list') {
    return (
      <div className="relative overflow-hidden">
        {/* Swipe Actions Background */}
        {isMobile && showSwipeActions && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center">
            {swipeActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`${action.color} text-white flex items-center justify-center w-12 h-full transition-all duration-200 ${touchStyles.touchTarget}`}
                style={{ transform: `translateX(${swipeOffset + 120}px)` }}
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}

        <Link href={`/dashboard/exercises/${exercise.id}`}>
          <div 
            ref={setRefs}
            className={`group bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300 cursor-pointer ${className}`}
            style={{ 
              transform: `translateX(${swipeOffset}px)`,
              transition: showSwipeActions ? 'transform 0.3s ease' : 'none'
            }}
          >
            <div className={`flex items-center ${isMobile ? 'p-4 space-x-4' : 'p-3 space-x-3'}`}>
              {/* Thumbnail */}
              <div className={`relative ${isMobile ? 'w-20 h-20' : 'w-16 h-16'} bg-gray-100 rounded-lg overflow-hidden flex-shrink-0`}>
                <Image
                  src={isGifPlaying && !imageError ? getGifPath() : getStaticImagePath()}
                  alt={exercise.name}
                  fill
                  className={`object-cover transition-all duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  unoptimized={isGifPlaying}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {isGifPlaying && (
                  <div className="absolute top-1 right-1">
                    <Play size={12} className="text-white drop-shadow-lg" />
                  </div>
                )}
                {isMobile && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                    <Play size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>

              {/* Exercise Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors ${
                      isMobile ? 'text-lg' : 'text-base'
                    } leading-tight`}>
                      {exercise.name}
                    </h3>
                    <div className={`flex items-center ${isMobile ? 'space-x-4 mt-2' : 'space-x-3 mt-1'} text-gray-500 ${
                      isMobile ? 'text-sm' : 'text-xs'
                    }`}>
                      <div className="flex items-center">
                        <Target size={isMobile ? 16 : 14} className="mr-1" />
                        {exercise.targetMuscles.slice(0, 2).join(', ')}
                        {exercise.targetMuscles.length > 2 && ` +${exercise.targetMuscles.length - 2}`}
                      </div>
                      <div className="flex items-center">
                        <Dumbbell size={isMobile ? 16 : 14} className="mr-1" />
                        {exercise.equipments.join(', ')}
                      </div>
                    </div>
                    <div className={`flex items-center space-x-2 ${isMobile ? 'mt-3' : 'mt-2'}`}>
                      {exercise.bodyParts.slice(0, 2).map((bodyPart) => (
                        <span
                          key={bodyPart}
                          className={`px-2 py-1 bg-gray-100 text-gray-700 rounded-full capitalize ${
                            isMobile ? 'text-xs' : 'text-xs'
                          }`}
                        >
                          {bodyPart}
                        </span>
                      ))}
                      {exercise.bodyParts.length > 2 && (
                        <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                          +{exercise.bodyParts.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Desktop Actions or Mobile Indicator */}
                  {!isMobile ? (
                    <div className="flex items-center space-x-1 ml-4">
                      <button
                        onClick={handleFavorite}
                        className={`p-2 rounded-lg transition-colors ${
                          exercise.isFavorited 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <Heart size={16} fill={exercise.isFavorited ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={handleQuickView}
                        className="p-2 text-gray-400 hover:text-blue-500 rounded-lg transition-colors"
                      >
                        <Info size={16} />
                      </button>
                      <button
                        onClick={handleAddToCollection}
                        className="p-2 text-gray-400 hover:text-green-500 rounded-lg transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="ml-4">
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  // Grid view
  return (
    <div className="relative overflow-hidden">
      <Link href={`/dashboard/exercises/${exercise.id}`}>
        <div 
          ref={setRefs}
          className={`group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer ${className}`}
        >
          {/* Image Container */}
          <div className="relative aspect-video bg-gray-100 overflow-hidden">
            <Image
              src={isGifPlaying && !imageError ? getGifPath() : getStaticImagePath()}
              alt={exercise.name}
              fill
              className={`object-cover transition-all duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              unoptimized={isGifPlaying}
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

            {/* Mobile Favorite Button */}
            {isMobile && (
              <button
                onClick={handleFavorite}
                className={`absolute top-3 left-3 ${touchStyles.buttonSize} rounded-full backdrop-blur-sm transition-all duration-200 ${touchStyles.touchTarget} ${
                  exercise.isFavorited
                    ? 'bg-red-500 text-white' 
                    : 'bg-white bg-opacity-80 text-gray-600 hover:bg-red-500 hover:text-white'
                }`}
              >
                <Heart size={isMobile ? 20 : 16} fill={exercise.isFavorited ? 'currentColor' : 'none'} />
              </button>
            )}

            {/* Desktop Hover Actions */}
            {!isMobile && (
              <>
                <button
                  onClick={handleFavorite}
                  className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 ${
                    exercise.isFavorited
                      ? 'bg-red-500 text-white' 
                      : 'bg-white bg-opacity-80 text-gray-600 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  <Heart size={16} fill={exercise.isFavorited ? 'currentColor' : 'none'} />
                </button>

                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100">
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
              </>
            )}
          </div>

          {/* Content */}
          <div className={isMobile ? 'p-4' : 'p-3'}>
            <div className="flex items-start justify-between mb-2">
              <h3 className={`font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight ${
                isMobile ? 'text-lg' : 'text-base'
              }`}>
                {exercise.name}
              </h3>
              {exercise.usageCount && exercise.usageCount > 0 && (
                <div className={`flex items-center text-gray-400 ml-2 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                  <Clock size={isMobile ? 16 : 14} className="mr-1" />
                  {exercise.usageCount}
                </div>
              )}
            </div>

            {/* Target Muscles */}
            <div className={`flex items-center text-gray-600 mb-3 ${isMobile ? 'text-sm' : 'text-xs'}`}>
              <Target size={isMobile ? 16 : 14} className="mr-2 text-gray-400" />
              <span className="truncate">
                {exercise.targetMuscles.slice(0, 2).join(', ')}
                {exercise.targetMuscles.length > 2 && ` +${exercise.targetMuscles.length - 2}`}
              </span>
            </div>

            {/* Equipment */}
            <div className={`flex items-center text-gray-600 mb-3 ${isMobile ? 'text-sm' : 'text-xs'}`}>
              <Dumbbell size={isMobile ? 16 : 14} className="mr-2 text-gray-400" />
              <span className="truncate">{exercise.equipments.join(', ')}</span>
            </div>

            {/* Body Parts Tags */}
            <div className="flex flex-wrap gap-1">
              {exercise.bodyParts.slice(0, 2).map((bodyPart) => (
                <span
                  key={bodyPart}
                  className={`px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium capitalize ${
                    isMobile ? 'text-xs' : 'text-xs'
                  }`}
                >
                  {bodyPart}
                </span>
              ))}
              {exercise.bodyParts.length > 2 && (
                <span className={`px-2 py-1 bg-gray-100 text-gray-600 rounded-md ${
                  isMobile ? 'text-xs' : 'text-xs'
                }`}>
                  +{exercise.bodyParts.length - 2}
                </span>
              )}
            </div>

            {/* Mobile Action Bar */}
            {isMobile && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddToCollection}
                    className={`flex items-center ${touchStyles.buttonPadding} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${touchStyles.touchTarget}`}
                  >
                    <Plus size={16} className="mr-1" />
                    Add
                  </button>
                  <button
                    onClick={handleQuickView}
                    className={`${touchStyles.buttonPadding} border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors ${touchStyles.touchTarget}`}
                  >
                    <Info size={16} />
                  </button>
                </div>
                
                {exercise.isFavorited && (
                  <div className="flex items-center text-red-500">
                    <Star size={16} fill="currentColor" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}