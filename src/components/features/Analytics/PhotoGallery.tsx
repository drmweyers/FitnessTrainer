'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import PhotoComparison from './PhotoComparison';

interface Photo {
  id: string;
  url: string;
  date: string;
  angle: 'front' | 'side' | 'back';
  isPublic: boolean;
  measurements?: {
    weight?: number;
    bodyFat?: number;
    muscleMass?: number;
  };
  notes?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onPrivacyToggle?: (photoId: string, isPublic: boolean) => void;
  onShare?: (photoIds: string[]) => void;
  onDelete?: (photoId: string) => void;
  canEdit?: boolean;
}

export default function PhotoGallery({
  photos,
  onPrivacyToggle,
  onShare,
  onDelete,
  canEdit = false,
}: PhotoGalleryProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [filterAngle, setFilterAngle] = useState<'all' | 'front' | 'side' | 'back'>('all');
  const [showComparison, setShowComparison] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Filter photos by angle
  const filteredPhotos = photos.filter(photo => 
    filterAngle === 'all' || photo.angle === filterAngle
  );

  // Sort photos by date
  const sortedPhotos = [...filteredPhotos].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handlePhotoSelect = (photoId: string) => {
    if (isSelectionMode) {
      setSelectedPhotos(prev => 
        prev.includes(photoId) 
          ? prev.filter(id => id !== photoId)
          : [...prev, photoId]
      );
    }
  };

  const handleBulkPrivacyToggle = (isPublic: boolean) => {
    if (onPrivacyToggle) {
      selectedPhotos.forEach(photoId => {
        onPrivacyToggle(photoId, isPublic);
      });
    }
    setSelectedPhotos([]);
    setIsSelectionMode(false);
  };

  const handleShare = () => {
    if (onShare && selectedPhotos.length > 0) {
      onShare(selectedPhotos);
      setShareModalOpen(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Timeline
            </button>
          </div>

          {/* Angle Filter */}
          <select
            value={filterAngle}
            onChange={(e) => setFilterAngle(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Angles</option>
            <option value="front">Front</option>
            <option value="side">Side</option>
            <option value="back">Back</option>
          </select>
        </div>

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex items-center space-x-2">
            {!isSelectionMode ? (
              <>
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Select
                </button>
                <button
                  onClick={() => setShowComparison(true)}
                  disabled={sortedPhotos.length < 2}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Compare
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedPhotos([]);
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <span className="text-sm text-gray-500">
                  {selectedPhotos.length} selected
                </span>
                {selectedPhotos.length > 0 && (
                  <>
                    <button
                      onClick={handleShare}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => handleBulkPrivacyToggle(true)}
                      className="px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100"
                    >
                      Make Public
                    </button>
                    <button
                      onClick={() => handleBulkPrivacyToggle(false)}
                      className="px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100"
                    >
                      Make Private
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Photo Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedPhotos.map(photo => (
            <div
              key={photo.id}
              className={`relative group cursor-pointer ${
                isSelectionMode && selectedPhotos.includes(photo.id)
                  ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg'
                  : ''
              }`}
              onClick={() => handlePhotoSelect(photo.id)}
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={photo.url}
                  alt={`Progress photo from ${formatDate(photo.date)}`}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Photo Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                <p className="text-white text-sm font-medium">{formatDate(photo.date)}</p>
                <p className="text-white text-xs opacity-90 capitalize">{photo.angle} view</p>
              </div>

              {/* Privacy Badge */}
              <div className="absolute top-2 left-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  photo.isPublic
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {photo.isPublic ? 'Public' : 'Private'}
                </div>
              </div>

              {/* Actions */}
              {canEdit && !isSelectionMode && (
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onPrivacyToggle && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrivacyToggle(photo.id, !photo.isPublic);
                      }}
                      className="p-1.5 bg-white rounded-lg shadow-md hover:bg-gray-50"
                      title={photo.isPublic ? 'Make Private' : 'Make Public'}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {photo.isPublic ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        )}
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this photo?')) {
                          onDelete(photo.id);
                        }
                      }}
                      className="p-1.5 bg-white rounded-lg shadow-md hover:bg-gray-50"
                      title="Delete"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Selection Checkbox */}
              {isSelectionMode && (
                <div className="absolute top-2 right-2">
                  <div className={`w-6 h-6 rounded-full border-2 ${
                    selectedPhotos.includes(photo.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}>
                    {selectedPhotos.includes(photo.id) && (
                      <svg className="w-full h-full text-white p-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-8">
          {sortedPhotos.map((photo, index) => (
            <div key={photo.id} className="flex space-x-4">
              <div className="flex-shrink-0 w-32 text-right">
                <p className="text-sm font-medium text-gray-900">{formatDate(photo.date)}</p>
                {photo.measurements && (
                  <div className="text-xs text-gray-500 mt-1">
                    {photo.measurements.weight && <p>Weight: {photo.measurements.weight} kg</p>}
                    {photo.measurements.bodyFat && <p>Body Fat: {photo.measurements.bodyFat}%</p>}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                <div className="w-4 h-4 bg-blue-500 rounded-full mt-1.5"></div>
                {index < sortedPhotos.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-300 ml-1.5 mt-2"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={photo.url}
                        alt={`Progress photo from ${formatDate(photo.date)}`}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">{photo.angle} view</p>
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            photo.isPublic
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {photo.isPublic ? 'Public' : 'Private'}
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex space-x-2">
                            {onPrivacyToggle && (
                              <button
                                onClick={() => onPrivacyToggle(photo.id, !photo.isPublic)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {photo.isPublic ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                  )}
                                </svg>
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this photo?')) {
                                    onDelete(photo.id);
                                  }
                                }}
                                className="text-red-400 hover:text-red-600"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {photo.notes && (
                        <p className="text-sm text-gray-600 mt-2">{photo.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Comparison Modal */}
      {showComparison && (
        <PhotoComparison
          photos={sortedPhotos}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Progress Photos</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  A shareable link has been created for your selected photos.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={`https://evofit.app/share/${Date.now()}`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://evofit.app/share/${Date.now()}`);
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Copy
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm text-gray-700">Include measurements</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-gray-700">Expire after 7 days</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}