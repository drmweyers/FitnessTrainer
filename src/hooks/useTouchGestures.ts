'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface TouchPoint {
  x: number
  y: number
  time: number
}

interface SwipeGestureOptions {
  minDistance?: number
  maxTime?: number
  threshold?: number
  preventScrollOnSwipe?: boolean
}

interface PinchGestureOptions {
  minScale?: number
  maxScale?: number
  threshold?: number
}

interface TapGestureOptions {
  maxDelay?: number
  maxDistance?: number
  tapCount?: number
}

interface GestureHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPinchIn?: (scale: number) => void
  onPinchOut?: (scale: number) => void
  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  onTouchStart?: (event: TouchEvent) => void
  onTouchEnd?: (event: TouchEvent) => void
}

export function useTouchGestures(
  handlers: GestureHandlers,
  options: {
    swipe?: SwipeGestureOptions
    pinch?: PinchGestureOptions
    tap?: TapGestureOptions
  } = {}
) {
  const elementRef = useRef<HTMLElement>(null)
  const touchStartRef = useRef<TouchPoint | null>(null)
  const touchEndRef = useRef<TouchPoint | null>(null)
  const lastTapRef = useRef<TouchPoint | null>(null)
  const longPressTimeoutRef = useRef<NodeJS.Timeout>()
  const pinchDistanceRef = useRef<number>(0)

  const {
    swipe: swipeOptions = {},
    pinch: pinchOptions = {},
    tap: tapOptions = {}
  } = options

  const {
    minDistance = 50,
    maxTime = 500,
    threshold = 10,
    preventScrollOnSwipe = true
  } = swipeOptions

  const {
    minScale = 0.5,
    maxScale = 3,
    threshold: pinchThreshold = 10
  } = pinchOptions

  const {
    maxDelay = 500,
    maxDistance = 10,
    tapCount = 1
  } = tapOptions

  const getDistance = useCallback((point1: TouchPoint, point2: TouchPoint) => {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    )
  }, [])

  const getPinchDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }, [])

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0]
    const touchPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    touchStartRef.current = touchPoint
    touchEndRef.current = null

    // Handle pinch start
    if (event.touches.length === 2) {
      pinchDistanceRef.current = getPinchDistance(event.touches)
    }

    // Start long press timer
    if (handlers.onLongPress) {
      longPressTimeoutRef.current = setTimeout(() => {
        handlers.onLongPress?.()
      }, 500)
    }

    handlers.onTouchStart?.(event)
  }, [handlers, getPinchDistance])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    // Clear long press if user moves
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = undefined
    }

    // Handle pinch gestures
    if (event.touches.length === 2 && pinchDistanceRef.current > 0) {
      const currentDistance = getPinchDistance(event.touches)
      const scale = currentDistance / pinchDistanceRef.current

      if (Math.abs(scale - 1) > pinchThreshold / 100) {
        if (scale < 1 && handlers.onPinchIn) {
          handlers.onPinchIn(Math.max(scale, minScale))
        } else if (scale > 1 && handlers.onPinchOut) {
          handlers.onPinchOut(Math.min(scale, maxScale))
        }
      }

      if (preventScrollOnSwipe) {
        event.preventDefault()
      }
    }

    // Prevent scroll during potential swipe
    if (event.touches.length === 1 && preventScrollOnSwipe && touchStartRef.current) {
      const touch = event.touches[0]
      const distance = getDistance(touchStartRef.current, {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      })

      if (distance > threshold) {
        event.preventDefault()
      }
    }
  }, [handlers, getPinchDistance, minScale, maxScale, pinchThreshold, preventScrollOnSwipe, getDistance, threshold])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    // Clear long press timer
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = undefined
    }

    if (!touchStartRef.current) return

    const touch = event.changedTouches[0]
    const touchEnd: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    touchEndRef.current = touchEnd

    const distance = getDistance(touchStartRef.current, touchEnd)
    const timeDiff = touchEnd.time - touchStartRef.current.time
    const deltaX = touchEnd.x - touchStartRef.current.x
    const deltaY = touchEnd.y - touchStartRef.current.y

    // Handle swipe gestures
    if (distance >= minDistance && timeDiff <= maxTime) {
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight()
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft()
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown()
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp()
        }
      }
    } 
    // Handle tap gestures
    else if (distance < maxDistance && timeDiff < maxDelay) {
      // Check for double tap
      if (handlers.onDoubleTap && lastTapRef.current) {
        const timeSinceLastTap = touchEnd.time - lastTapRef.current.time
        const distanceFromLastTap = getDistance(lastTapRef.current, touchEnd)
        
        if (timeSinceLastTap < 500 && distanceFromLastTap < maxDistance) {
          handlers.onDoubleTap()
          lastTapRef.current = null
          return
        }
      }

      // Single tap
      if (handlers.onTap) {
        handlers.onTap()
      }

      lastTapRef.current = touchEnd
    }

    handlers.onTouchEnd?.(event)
  }, [
    handlers, 
    getDistance, 
    minDistance, 
    maxTime, 
    maxDistance, 
    maxDelay
  ])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Add passive listeners for better performance
    const options = { passive: false }

    element.addEventListener('touchstart', handleTouchStart, options)
    element.addEventListener('touchmove', handleTouchMove, options)
    element.addEventListener('touchend', handleTouchEnd, options)

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)

      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return elementRef
}

// Helper hook for detecting mobile/touch devices
export function useIsMobile() {
  const checkIsMobile = useCallback(() => {
    if (typeof window === 'undefined') return false
    
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      window.innerWidth <= 768
    )
  }, [])

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(checkIsMobile())

    const handleResize = () => {
      setIsMobile(checkIsMobile())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [checkIsMobile])

  return isMobile
}

// Helper hook for touch-friendly button sizing
export function useTouchFriendlyStyles() {
  const isMobile = useIsMobile()

  return {
    buttonSize: isMobile ? 'h-12 w-12 min-w-12' : 'h-10 w-10',
    buttonPadding: isMobile ? 'p-3' : 'p-2',
    buttonText: isMobile ? 'text-base' : 'text-sm',
    spacing: isMobile ? 'space-x-4 space-y-4' : 'space-x-2 space-y-2',
    touchTarget: isMobile ? 'min-h-12 min-w-12' : 'min-h-8 min-w-8'
  }
}