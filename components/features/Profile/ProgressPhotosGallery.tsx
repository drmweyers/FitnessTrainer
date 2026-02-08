'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProgressPhoto {
  id: string;
  photoUrl: string;
  thumbnailUrl: string | null;
  photoType: string;
  notes: string | null;
  isPrivate: boolean;
  takenAt: string | null;
  uploadedAt: string;
}

interface ProgressPhotosGalleryProps {
  userId?: string;
}

export default function ProgressPhotosGallery({ userId }: ProgressPhotosGalleryProps) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'front' | 'side' | 'back'>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/profiles/progress-photos', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const result = await res.json();
      if (result.success) {
        setPhotos(result.data || []);
      }
    } catch (err) {
      console.error('Failed to load progress photos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPhotos = filter === 'all'
    ? photos
    : photos.filter(p => p.photoType === filter);

  const togglePhotoSelect = (id: string) => {
    if (selectedPhotos.includes(id)) {
      setSelectedPhotos(prev => prev.filter(p => p !== id));
    } else if (selectedPhotos.length < 2) {
      setSelectedPhotos(prev => [...prev, id]);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown date';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const comparedPhotos = selectedPhotos
    .map(id => photos.find(p => p.id === id))
    .filter(Boolean) as ProgressPhoto[];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Progress Photos</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={compareMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedPhotos([]);
              }}
            >
              {compareMode ? 'Exit Compare' : 'Compare'}
            </Button>
            <Button size="sm" onClick={() => window.location.href = '/analytics'}>
              Upload Photo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Type Filter */}
        <div className="flex space-x-2 mb-4">
          {(['all', 'front', 'side', 'back'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === type
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {compareMode && selectedPhotos.length > 0 && (
          <p className="text-sm text-blue-600 mb-3">
            {selectedPhotos.length === 1 ? 'Select one more photo to compare' : 'Comparing 2 photos'}
          </p>
        )}

        {/* Compare View */}
        {compareMode && comparedPhotos.length === 2 && (
          <div className="grid grid-cols-2 gap-4 mb-6 border border-blue-200 rounded-lg p-4 bg-blue-50">
            {comparedPhotos.map(photo => (
              <div key={photo.id} className="text-center">
                <div className="aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden mb-2">
                  <img
                    src={photo.photoUrl}
                    alt={`Progress photo - ${photo.photoType}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(photo.takenAt || photo.uploadedAt)}
                </p>
                <p className="text-xs text-gray-500 capitalize">{photo.photoType}</p>
              </div>
            ))}
          </div>
        )}

        {/* Photo Grid */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredPhotos.map(photo => (
              <div
                key={photo.id}
                onClick={() => compareMode && togglePhotoSelect(photo.id)}
                className={`relative group cursor-pointer ${
                  compareMode && selectedPhotos.includes(photo.id)
                    ? 'ring-2 ring-blue-500 rounded-lg'
                    : ''
                }`}
              >
                <div className="aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={photo.photoUrl}
                    alt={`Progress photo - ${photo.photoType}`}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                </div>
                <div className="mt-1">
                  <p className="text-xs text-gray-600">{formatDate(photo.takenAt || photo.uploadedAt)}</p>
                  <p className="text-xs text-gray-400 capitalize">{photo.photoType}</p>
                </div>
                {compareMode && selectedPhotos.includes(photo.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {selectedPhotos.indexOf(photo.id) + 1}
                    </span>
                  </div>
                )}
                {photo.isPrivate && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-gray-800 bg-opacity-70 rounded text-xs text-white">
                    Private
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500 mb-2">No progress photos yet</p>
            <p className="text-xs text-gray-400">Upload photos from the Analytics page to track visual progress</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
