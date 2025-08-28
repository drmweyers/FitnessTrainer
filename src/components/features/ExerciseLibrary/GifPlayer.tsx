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
  AlertCircle
} from 'lucide-react'

interface GifPlayerProps {
  exerciseId: string
  gifUrl: string
  exerciseName: string
  autoPlay?: boolean
  showControls?: boolean
  className?: string
}

export function GifPlayer({
  exerciseId,
  gifUrl,
  exerciseName,
  autoPlay = false,
  showControls = true,
  className = ''
}: GifPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(true) // GIFs don't have audio, but kept for future video support
  const [showControlsOverlay, setShowControlsOverlay] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  // Get the full path to the GIF
  const getGifPath = useCallback(() => {
    // For now, assume GIFs are in the public/exerciseGifs directory
    return `/exerciseGifs/${gifUrl}`
  }, [gifUrl])

  // Handle play/pause toggle
  const togglePlayback = () => {
    setIsPlaying(prev => !prev)
  }

  // Reset the GIF by forcing a reload
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

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  // Handle download
  const downloadGif = () => {
    const link = document.createElement('a')
    link.href = getGifPath()
    link.download = `${exerciseName.replace(/\s+/g, '_').toLowerCase()}.gif`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Show/hide controls overlay
  const handleMouseEnter = () => {
    setShowControlsOverlay(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
  }

  const handleMouseLeave = () => {
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControlsOverlay(false)
    }, 2000)
  }

  const handleMouseMove = () => {
    setShowControlsOverlay(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControlsOverlay(false)
    }, 2000)
  }

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
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

  if (hasError) {
    return (
      <div className={`relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load exercise GIF</h3>
          <p className="text-gray-500 text-sm mb-4">
            The exercise demonstration is currently unavailable.
          </p>
          <button
            onClick={() => {
              setHasError(false)
              setIsLoading(true)
              resetGif()
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-gray-900 rounded-lg overflow-hidden group ${className} ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 size={32} className="text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading exercise...</p>
          </div>
        </div>
      )}

      {/* GIF Image */}
      <div className="relative w-full h-full">
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
          unoptimized // Allow GIF animation
          priority
        />

        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <button
              onClick={togglePlayback}
              className="w-16 h-16 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all hover:scale-105"
            >
              <Play size={24} className="text-gray-800 ml-1" />
            </button>
          </div>
        )}

        {/* Controls Overlay */}
        {showControls && (showControlsOverlay || !isPlaying) && (
          <div className="absolute inset-0">
            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
              <div className="flex items-center justify-between text-white">
                <h3 className="font-medium capitalize">{exerciseName}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={downloadGif}
                    className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-colors"
                    title="Download GIF"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-colors"
                    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Center Play/Pause Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlayback}
                className="w-16 h-16 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all"
              >
                {isPlaying ? (
                  <Pause size={24} className="text-white" />
                ) : (
                  <Play size={24} className="text-white ml-1" />
                )}
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={togglePlayback}
                    className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-colors"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={resetGif}
                    className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-colors"
                    title="Restart GIF"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Speed Control (for future video support) */}
                  <div className="text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                    1x
                  </div>
                  
                  {/* Volume Control (placeholder for future video support) */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-colors opacity-50 cursor-not-allowed"
                    disabled
                    title="Volume control (not available for GIFs)"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        {isPlaying && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center space-x-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span>Playing</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}