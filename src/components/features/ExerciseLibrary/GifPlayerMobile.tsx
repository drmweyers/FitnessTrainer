'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize,
  Minimize,
  Download,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { useTouchGestures, useIsMobile, useTouchFriendlyStyles } from '@/hooks/useTouchGestures'

interface GifPlayerMobileProps {
  exerciseId: string
  gifUrl: string
  exerciseName: string
  autoPlay?: boolean
  showControls?: boolean
  enableSwipeNavigation?: boolean
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}

export default function GifPlayerMobile({
  exerciseId,
  gifUrl,
  exerciseName,
  autoPlay = false,
  showControls = true,
  enableSwipeNavigation = true,
  onSwipeLeft,
  onSwipeRight,
  className = ''
}: GifPlayerMobileProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControlsOverlay, setShowControlsOverlay] = useState(true)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  const isMobile = useIsMobile()
  const touchStyles = useTouchFriendlyStyles()

  // Touch gesture handlers
  const gestureRef = useTouchGestures({
    onTap: () => {
      if (isMobile) {
        setShowControlsOverlay(prev => !prev)
        resetControlsTimeout()
      }
    },
    onDoubleTap: () => {
      if (isMobile) {
        togglePlayback()
      }
    },
    onSwipeLeft: () => {
      if (enableSwipeNavigation && onSwipeLeft) {
        onSwipeLeft()
      }
    },
    onSwipeRight: () => {
      if (enableSwipeNavigation && onSwipeRight) {
        onSwipeRight()
      }
    },
    onSwipeUp: () => {
      if (isMobile && !isFullscreen) {
        toggleFullscreen()
      }
    },
    onSwipeDown: () => {
      if (isMobile && isFullscreen) {
        toggleFullscreen()
      }
    },
    onPinchIn: (newScale) => {
      if (isMobile && isFullscreen) {
        setScale(Math.max(0.5, newScale))
      }
    },
    onPinchOut: (newScale) => {
      if (isMobile && isFullscreen) {
        setScale(Math.min(3, newScale))
      }
    },
    onLongPress: () => {
      if (isMobile) {
        resetGif()
      }
    }
  }, {
    swipe: { minDistance: 50, maxTime: 300 },
    pinch: { minScale: 0.5, maxScale: 3 },
    tap: { maxDelay: 300, maxDistance: 10 }
  })

  const getGifPath = useCallback(() => {
    return `/exerciseGifs/${gifUrl}`
  }, [gifUrl])

  const togglePlayback = () => {
    setIsPlaying(prev => !prev)
    if (isMobile) {
      // Show controls briefly when toggling on mobile
      setShowControlsOverlay(true)
      resetControlsTimeout()
    }
  }

  const resetGif = () => {
    if (imageRef.current) {
      const src = imageRef.current.src
      imageRef.current.src = ''
      setTimeout(() => {
        if (imageRef.current) {
          imageRef.current.src = src
        }
      }, 10)
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
        // Enable screen orientation lock on mobile
        if ('orientation' in screen && typeof (screen as any).orientation?.lock === 'function') {
          try {
            await (screen as any).orientation.lock('landscape')
          } catch (e) {
            // Orientation lock not supported or failed
          }
        }
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
        setScale(1)
        setPosition({ x: 0, y: 0 })
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      setScale(prev => Math.min(3, prev + 0.25))
    } else {
      setScale(prev => Math.max(0.5, prev - 0.25))
    }
  }

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isMobile) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControlsOverlay(false)
      }, 3000) // Longer timeout on mobile
    }
  }

  const downloadGif = () => {
    const link = document.createElement('a')
    link.href = getGifPath()
    link.download = `${exerciseName.replace(/\s+/g, '_').toLowerCase()}.gif`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Auto-hide controls on mobile
  useEffect(() => {
    if (isMobile && showControlsOverlay) {
      resetControlsTimeout()
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControlsOverlay, isMobile])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Handle image load states
  const handleImageLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  // Combine refs
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    // Update containerRef
    if (containerRef && 'current' in containerRef) {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    }

    // Update gestureRef
    if (gestureRef && 'current' in gestureRef) {
      (gestureRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    }
  }, [])

  if (hasError) {
    return (
      <div className={`relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <AlertCircle size={isMobile ? 64 : 48} className="text-gray-400 mx-auto mb-4" />
          <h3 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold text-gray-900 mb-2`}>
            Unable to load exercise GIF
          </h3>
          <p className={`text-gray-500 ${isMobile ? 'text-base' : 'text-sm'} mb-4`}>
            The exercise demonstration is currently unavailable.
          </p>
          <button
            onClick={() => {
              setHasError(false)
              setIsLoading(true)
              resetGif()
            }}
            className={`${touchStyles.buttonPadding} ${touchStyles.buttonText} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${touchStyles.touchTarget}`}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setRefs}
      className={`relative bg-gray-900 rounded-lg overflow-hidden ${className} ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 size={isMobile ? 48 : 32} className="text-blue-600 animate-spin mx-auto mb-2" />
            <p className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-600`}>
              Loading exercise...
            </p>
          </div>
        </div>
      )}

      {/* GIF Image */}
      <div className="relative w-full h-full overflow-hidden">
        <div
          className="w-full h-full transition-transform duration-300"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
          }}
        >
          <Image
            ref={imageRef}
            src={getGifPath()}
            alt={`${exerciseName} demonstration`}
            fill
            className={`object-contain transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            unoptimized
            priority
          />
        </div>

        {/* Mobile Swipe Indicators */}
        {isMobile && enableSwipeNavigation && (
          <>
            {onSwipeLeft && (
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-30">
                <ChevronLeft size={32} className="text-white" />
              </div>
            )}
            {onSwipeRight && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-30">
                <ChevronRight size={32} className="text-white" />
              </div>
            )}
          </>
        )}

        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <button
              onClick={togglePlayback}
              className={`${
                isMobile ? 'w-20 h-20' : 'w-16 h-16'
              } bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all hover:scale-105 ${touchStyles.touchTarget}`}
            >
              <Play size={isMobile ? 32 : 24} className="text-gray-800 ml-1" />
            </button>
          </div>
        )}

        {/* Controls Overlay */}
        {showControls && showControlsOverlay && (
          <div className="absolute inset-0">
            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex items-center justify-between text-white">
                <h3 className={`font-medium capitalize ${touchStyles.buttonText}`}>
                  {exerciseName}
                </h3>
                <div className="flex items-center space-x-2">
                  {isMobile && isFullscreen && (
                    <>
                      <button
                        onClick={() => handleZoom('out')}
                        className={`${touchStyles.buttonPadding} bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-colors ${touchStyles.touchTarget}`}
                        title="Zoom out"
                      >
                        <ZoomOut size={isMobile ? 20 : 16} />
                      </button>
                      <button
                        onClick={() => handleZoom('in')}
                        className={`${touchStyles.buttonPadding} bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-colors ${touchStyles.touchTarget}`}
                        title="Zoom in"
                      >
                        <ZoomIn size={isMobile ? 20 : 16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={downloadGif}
                    className={`${touchStyles.buttonPadding} bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-colors ${touchStyles.touchTarget}`}
                    title="Download GIF"
                  >
                    <Download size={isMobile ? 20 : 16} />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className={`${touchStyles.buttonPadding} bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-colors ${touchStyles.touchTarget}`}
                    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {isFullscreen ? (
                      <Minimize size={isMobile ? 20 : 16} />
                    ) : (
                      <Maximize size={isMobile ? 20 : 16} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Center Play/Pause Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlayback}
                className={`${
                  isMobile ? 'w-20 h-20' : 'w-16 h-16'
                } bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all ${touchStyles.touchTarget}`}
              >
                {isPlaying ? (
                  <Pause size={isMobile ? 32 : 24} className="text-white" />
                ) : (
                  <Play size={isMobile ? 32 : 24} className="text-white ml-1" />
                )}
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex items-center justify-between text-white">
                <div className={`flex items-center ${isMobile ? 'space-x-4' : 'space-x-3'}`}>
                  <button
                    onClick={togglePlayback}
                    className={`${touchStyles.buttonPadding} bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-colors ${touchStyles.touchTarget}`}
                  >
                    {isPlaying ? (
                      <Pause size={isMobile ? 20 : 16} />
                    ) : (
                      <Play size={isMobile ? 20 : 16} />
                    )}
                  </button>
                  <button
                    onClick={resetGif}
                    className={`${touchStyles.buttonPadding} bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-colors ${touchStyles.touchTarget}`}
                    title="Restart GIF"
                  >
                    <RotateCcw size={isMobile ? 20 : 16} />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Speed Control */}
                  <div className={`${touchStyles.buttonText} bg-black bg-opacity-50 px-3 py-2 rounded ${touchStyles.touchTarget}`}>
                    1x
                  </div>
                  
                  {/* Volume Control (placeholder) */}
                  <button
                    className={`${touchStyles.buttonPadding} bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-colors opacity-50 cursor-not-allowed ${touchStyles.touchTarget}`}
                    disabled
                    title="Volume control (not available for GIFs)"
                  >
                    <VolumeX size={isMobile ? 20 : 16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        {isPlaying && (
          <div className="absolute top-4 right-4">
            <div className={`flex items-center space-x-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded-full ${touchStyles.buttonText}`}>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span>Playing</span>
            </div>
          </div>
        )}

        {/* Mobile gesture hints */}
        {isMobile && !showControlsOverlay && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
              Tap to show controls
            </div>
          </div>
        )}
      </div>
    </div>
  )
}