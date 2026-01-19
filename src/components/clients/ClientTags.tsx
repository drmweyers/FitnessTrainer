'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Tag as TagIcon, Palette } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Card } from '@/components/shared/Card';
import { tagsApi, clientsApi, ApiError } from '@/lib/api/clients';
import { ClientTag } from '@/types/client';

interface ClientTagsProps {
  clientId: string;
}

const TAG_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#64748B', '#6B7280', '#374151'
];

export default function ClientTags({ clientId }: ClientTagsProps) {
  const [allTags, setAllTags] = useState<ClientTag[]>([]);
  const [clientTags, setClientTags] = useState<ClientTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New tag form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tagsResponse, clientResponse] = await Promise.all([
        tagsApi.getTags(),
        clientsApi.getClientById(clientId)
      ]);

      setAllTags(Array.isArray(tagsResponse) ? tagsResponse : (tagsResponse.data || []));
      const clientData = 'data' in clientResponse ? clientResponse.data : clientResponse;
      setClientTags(clientData?.tags || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to fetch tags';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchData();
    }
  }, [clientId]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setSubmitting(true);
    try {
      const newTag = await tagsApi.createTag({
        name: newTagName.trim(),
        color: newTagColor,
      });
      
      setAllTags(prev => [...prev, newTag]);
      setNewTagName('');
      setNewTagColor(TAG_COLORS[0]);
      setShowCreateForm(false);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to create tag';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTag = async (tag: ClientTag) => {
    try {
      await tagsApi.assignTags(clientId, [tag.id]);
      setClientTags(prev => [...prev, tag]);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to assign tag';
      setError(errorMessage);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await tagsApi.removeTags(clientId, [tagId]);
      setClientTags(prev => prev.filter(tag => tag.id !== tagId));
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to remove tag';
      setError(errorMessage);
    }
  };

  const availableTags = allTags.filter(
    tag => !clientTags.some(clientTag => clientTag.id === tag.id)
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-7 bg-gray-200 rounded-full w-20"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TagIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Client Tags
          </h3>
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            {clientTags.length}
          </span>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          leftIcon={<Plus className="h-4 w-4" />}
          size="sm"
        >
          Create Tag
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="mt-2 border-red-300 text-red-700"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Create Tag Form */}
      {showCreateForm && (
        <Card>
          <Card.Header>
            <Card.Title className="text-base">Create New Tag</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <Input
                label="Tag Name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name..."
                maxLength={50}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newTagColor === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="mt-2">
                  <Input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-20 h-10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {newTagName.length}/50 characters
                </span>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewTagName('');
                      setNewTagColor(TAG_COLORS[0]);
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTag}
                    size="sm"
                    isLoading={submitting}
                    disabled={!newTagName.trim() || submitting}
                  >
                    Create Tag
                  </Button>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Current Tags */}
      <Card>
        <Card.Header>
          <Card.Title className="text-base">Current Tags</Card.Title>
        </Card.Header>
        <Card.Content>
          {clientTags.length === 0 ? (
            <div className="text-center py-8">
              <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No tags assigned yet</p>
              <p className="text-sm text-gray-400">
                Assign tags from the available tags below or create new ones
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {clientTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    className="ml-1 text-white hover:text-gray-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Available Tags */}
      {availableTags.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title className="text-base">Available Tags</Card.Title>
            <p className="text-sm text-gray-600">
              Click a tag to assign it to this client
            </p>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleAssignTag(tag)}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                  <Plus className="ml-1 h-3 w-3" />
                </button>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Tag Management Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start space-x-3">
          <Palette className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Tag Management Tips
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use tags to categorize clients by goals, experience level, or preferences</li>
              <li>• Color-code tags for quick visual identification</li>
              <li>• Tags help with filtering and organizing your client base</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}