'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Save, Palette, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Card } from '@/components/shared/Card';
import { tagsApi, ApiError } from '@/lib/api/clients';
import { ClientTag, CreateTagData, UpdateTagData } from '@/types/client';

interface TagManagerProps {
  onClose: () => void;
}

const TAG_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#64748B', '#6B7280', '#374151'
];

export default function TagManager({ onClose }: TagManagerProps) {
  const [tags, setTags] = useState<ClientTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTag, setNewTag] = useState<CreateTagData>({
    name: '',
    color: TAG_COLORS[0],
  });

  // Edit state
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editData, setEditData] = useState<UpdateTagData>({});
  
  const [submitting, setSubmitting] = useState(false);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tagsApi.getTags();
      setTags(Array.isArray(response) ? response : ((response as any).data || []));
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
    fetchTags();
  }, []);

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) return;

    setSubmitting(true);
    try {
      const createdTag = await tagsApi.createTag({
        name: newTag.name.trim(),
        color: newTag.color,
      });
      
      setTags(prev => [...prev, createdTag]);
      setNewTag({ name: '', color: TAG_COLORS[0] });
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

  const handleUpdateTag = async (tagId: string) => {
    if (!editData.name?.trim() && !editData.color) return;

    setSubmitting(true);
    try {
      const updatedTag = await tagsApi.updateTag(tagId, editData);
      
      setTags(prev => 
        prev.map(tag => 
          tag.id === tagId ? updatedTag : tag
        )
      );
      
      setEditingTag(null);
      setEditData({});
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to update tag';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove it from all clients.')) {
      return;
    }

    try {
      await tagsApi.deleteTag(tagId);
      setTags(prev => prev.filter(tag => tag.id !== tagId));
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to delete tag';
      setError(errorMessage);
    }
  };

  const startEditing = (tag: ClientTag) => {
    setEditingTag(tag.id);
    setEditData({
      name: tag.name,
      color: tag.color,
    });
  };

  const cancelEditing = () => {
    setEditingTag(null);
    setEditData({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Tag Manager
              </h2>
              <p className="text-purple-100 text-sm">
                Create, edit, and organize your client tags
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTags}
              className="mt-2 border-red-300 text-red-700"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Create New Tag Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Tag</h3>
              {!showCreateForm && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                  size="sm"
                >
                  New Tag
                </Button>
              )}
            </div>

            {showCreateForm && (
              <Card>
                <Card.Content className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Tag Name"
                        value={newTag.name}
                        onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter tag name..."
                        maxLength={50}
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        {newTag.name.length}/50 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <div className="grid grid-cols-10 gap-1 mb-2">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewTag(prev => ({ ...prev, color }))}
                            className={`w-6 h-6 rounded border-2 ${
                              newTag.color === color ? 'border-gray-800' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <Input
                        type="color"
                        value={newTag.color}
                        onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full h-10"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewTag({ name: '', color: TAG_COLORS[0] });
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateTag}
                      isLoading={submitting}
                      disabled={!newTag.name.trim() || submitting}
                    >
                      Create Tag
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            )}
          </div>

          {/* Existing Tags Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Existing Tags ({tags.length})
            </h3>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <Card.Content className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                ))}
              </div>
            ) : tags.length === 0 ? (
              <Card>
                <Card.Content className="p-8 text-center">
                  <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tags created yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first tag to start organizing your clients.
                  </p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Create First Tag
                  </Button>
                </Card.Content>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tags.map((tag) => (
                  <Card key={tag.id}>
                    <Card.Content className="p-4">
                      {editingTag === tag.id ? (
                        <div className="space-y-3">
                          <Input
                            label="Name"
                            value={editData.name || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                            maxLength={50}
                          />
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Color
                            </label>
                            <div className="grid grid-cols-10 gap-1 mb-2">
                              {TAG_COLORS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setEditData(prev => ({ ...prev, color }))}
                                  className={`w-4 h-4 rounded border ${
                                    editData.color === color ? 'border-gray-800' : 'border-gray-300'
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <Input
                              type="color"
                              value={editData.color || tag.color}
                              onChange={(e) => setEditData(prev => ({ ...prev, color: e.target.value }))}
                              className="w-full h-8"
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                              disabled={submitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleUpdateTag(tag.id)}
                              size="sm"
                              isLoading={submitting && editingTag === tag.id}
                              disabled={submitting}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: tag.color }}
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">{tag.name}</h4>
                              <p className="text-sm text-gray-500">{tag.color}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(tag)}
                              disabled={submitting}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTag(tag.id)}
                              disabled={submitting}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card.Content>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}