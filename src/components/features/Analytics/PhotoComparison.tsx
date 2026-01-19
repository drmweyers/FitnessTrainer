'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Photo {
  id: string;
  url: string;
  date: string;
  measurements?: {
    weight?: number;
    bodyFat?: number;
  };
  angle: 'front' | 'side' | 'back';
}

interface PhotoComparisonProps {
  photos: Photo[];
  onClose?: () => void;
}

type ComparisonMode = 'side-by-side' | 'slider' | 'timeline';

export default function PhotoComparison({ photos, onClose }: PhotoComparisonProps) {
  const [mode, setMode] = useState<ComparisonMode>('side-by-side');
  const [selectedPhotos, setSelectedPhotos] = useState<[Photo | null, Photo | null]>([null, null]);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [selectedAngle, setSelectedAngle] = useState<'front' | 'side' | 'back'>('front');
  const [isSliding, setIsSliding] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Group photos by angle
  const photosByAngle = photos.reduce((acc, photo) => {
    if (!acc[photo.angle]) acc[photo.angle] = [];
    acc[photo.angle].push(photo);
    return acc;
  }, {} as Record<string, Photo[]>);

  // Sort photos by date
  Object.keys(photosByAngle).forEach(angle => {
    photosByAngle[angle].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  });

  // Initialize with first and last photos
  useEffect(() => {
    const anglePhotos = photosByAngle[selectedAngle] || [];
    if (anglePhotos.length > 0) {
      setSelectedPhotos([
        anglePhotos[0],
        anglePhotos[anglePhotos.length - 1]
      ]);
    }
  }, [selectedAngle]);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isSliding || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  const handleMouseUp = () => {
    setIsSliding(false);
  };

  useEffect(() => {
    if (isSliding) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isSliding]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDaysBetween = () => {
    if (!selectedPhotos[0] || !selectedPhotos[1]) return 0;
    const date1 = new Date(selectedPhotos[0].date);
    const date2 = new Date(selectedPhotos[1].date);
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const anglePhotos = photosByAngle[selectedAngle] || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h2 className="text-xl font-semibold">Progress Photo Comparison</h2>
          
          {/* Mode Selector */}
          <div className="flex items-center space-x-4">
            {/* Angle Selector */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              {(['front', 'side', 'back'] as const).map(angle => (
                <button
                  key={angle}
                  onClick={() => setSelectedAngle(angle)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                    selectedAngle === angle
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  disabled={!photosByAngle[angle] || photosByAngle[angle].length === 0}
                >
                  {angle} ({photosByAngle[angle]?.length || 0})
                </button>
              ))}
            </div>

            {/* Comparison Mode */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              {(['side-by-side', 'slider', 'timeline'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    mode === m
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {m === 'side-by-side' ? 'Side by Side' : 
                   m === 'slider' ? 'Slider' : 'Timeline'}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'side-by-side' && selectedPhotos[0] && selectedPhotos[1] && (
          <div className="h-full flex">
            {/* Left Photo */}
            <div className="flex-1 relative">
              <Image
                src={selectedPhotos[0].url}
                alt="Before"
                fill
                className="object-contain"
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg">
                <p className="text-sm font-medium">Before</p>
                <p className="text-xs">{formatDate(selectedPhotos[0].date)}</p>
                {selectedPhotos[0].measurements && (
                  <>
                    {selectedPhotos[0].measurements.weight && (
                      <p className="text-xs mt-1">Weight: {selectedPhotos[0].measurements.weight} kg</p>
                    )}
                    {selectedPhotos[0].measurements.bodyFat && (
                      <p className="text-xs">Body Fat: {selectedPhotos[0].measurements.bodyFat}%</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-gray-700"></div>

            {/* Right Photo */}
            <div className="flex-1 relative">
              <Image
                src={selectedPhotos[1].url}
                alt="After"
                fill
                className="object-contain"
              />
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-right">
                <p className="text-sm font-medium">After</p>
                <p className="text-xs">{formatDate(selectedPhotos[1].date)}</p>
                {selectedPhotos[1].measurements && (
                  <>
                    {selectedPhotos[1].measurements.weight && (
                      <p className="text-xs mt-1">Weight: {selectedPhotos[1].measurements.weight} kg</p>
                    )}
                    {selectedPhotos[1].measurements.bodyFat && (
                      <p className="text-xs">Body Fat: {selectedPhotos[1].measurements.bodyFat}%</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Progress Stats */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">{calculateDaysBetween()} days of progress</p>
              {selectedPhotos[0].measurements && selectedPhotos[1].measurements && (
                <div className="flex space-x-4 mt-1">
                  {selectedPhotos[0].measurements.weight && selectedPhotos[1].measurements.weight && (
                    <p className="text-xs">
                      Weight: {(selectedPhotos[1].measurements.weight - selectedPhotos[0].measurements.weight).toFixed(1)} kg
                    </p>
                  )}
                  {selectedPhotos[0].measurements.bodyFat && selectedPhotos[1].measurements.bodyFat && (
                    <p className="text-xs">
                      Body Fat: {(selectedPhotos[1].measurements.bodyFat - selectedPhotos[0].measurements.bodyFat).toFixed(1)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {mode === 'slider' && selectedPhotos[0] && selectedPhotos[1] && (
          <div 
            ref={sliderRef}
            className="h-full relative cursor-ew-resize"
            onMouseDown={() => setIsSliding(true)}
          >
            {/* After Photo (Background) */}
            <div className="absolute inset-0">
              <Image
                src={selectedPhotos[1].url}
                alt="After"
                fill
                className="object-contain"
              />
            </div>

            {/* Before Photo (Foreground with clip) */}
            <div 
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <Image
                src={selectedPhotos[0].url}
                alt="Before"
                fill
                className="object-contain"
              />
            </div>

            {/* Slider Line */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
              <p className="text-sm font-medium">Before</p>
              <p className="text-xs">{formatDate(selectedPhotos[0].date)}</p>
            </div>
            <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
              <p className="text-sm font-medium">After</p>
              <p className="text-xs">{formatDate(selectedPhotos[1].date)}</p>
            </div>
          </div>
        )}

        {mode === 'timeline' && (
          <div className="h-full flex flex-col">
            {/* Timeline Photos */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex h-full space-x-4 p-4">
                {anglePhotos.map((photo, index) => (
                  <div key={photo.id} className="flex-shrink-0 w-80">
                    <div className="h-full flex flex-col">
                      <div className="flex-1 relative bg-gray-800 rounded-lg overflow-hidden">
                        <Image
                          src={photo.url}
                          alt={`Progress ${index + 1}`}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="mt-2 text-white text-center">
                        <p className="text-sm font-medium">{formatDate(photo.date)}</p>
                        {photo.measurements && (
                          <div className="text-xs text-gray-400 mt-1">
                            {photo.measurements.weight && <span>Weight: {photo.measurements.weight} kg</span>}
                            {photo.measurements.weight && photo.measurements.bodyFat && <span> • </span>}
                            {photo.measurements.bodyFat && <span>Body Fat: {photo.measurements.bodyFat}%</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Indicator */}
            <div className="px-4 pb-4">
              <div className="relative h-2 bg-gray-700 rounded-full">
                <div className="absolute inset-0 flex justify-between">
                  {anglePhotos.map((_, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 bg-blue-500 rounded-full -mt-1"
                      style={{ 
                        position: 'absolute',
                        left: `${(index / (anglePhotos.length - 1)) * 100}%`,
                        transform: 'translateX(-50%)'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Selector (for side-by-side and slider modes) */}
      {mode !== 'timeline' && anglePhotos.length > 0 && (
        <div className="bg-gray-900 p-4 border-t border-gray-700">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 gap-4">
              {/* Before Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Before Photo</label>
                <div className="flex space-x-2 overflow-x-auto">
                  {anglePhotos.map(photo => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhotos([photo, selectedPhotos[1]])}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedPhotos[0]?.id === photo.id
                          ? 'border-blue-500'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <Image
                        src={photo.url}
                        alt={formatDate(photo.date)}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* After Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select After Photo</label>
                <div className="flex space-x-2 overflow-x-auto">
                  {anglePhotos.map(photo => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhotos([selectedPhotos[0], photo])}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedPhotos[1]?.id === photo.id
                          ? 'border-blue-500'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <Image
                        src={photo.url}
                        alt={formatDate(photo.date)}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}