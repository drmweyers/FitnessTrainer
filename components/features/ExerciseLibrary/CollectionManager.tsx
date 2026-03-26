'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Plus,
  Folder,
  Hash,
  Trash2,
  Edit3,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { useCollections } from '@/hooks/useCollections'

/**
 * CollectionManager renders the user's exercise collections as a grid of cards.
 * Allows creating new collections and deleting existing ones.
 */
export function CollectionManager() {
  const {
    collections,
    isLoading,
    error,
    createCollection,
    deleteCollection,
  } = useCollections()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleOpenCreate = () => {
    setNewName('')
    setNewDescription('')
    setCreateError(null)
    setShowCreateModal(true)
  }

  const handleCloseCreate = () => {
    setShowCreateModal(false)
    setCreateError(null)
  }

  const handleCreate = async () => {
    const trimmedName = newName.trim()
    if (!trimmedName) return

    try {
      setIsCreating(true)
      setCreateError(null)
      await createCollection(trimmedName, newDescription.trim())
      setShowCreateModal(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create collection')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (collectionId: string, collectionName: string) => {
    if (!confirm(`Delete "${collectionName}"? This action cannot be undone.`)) return
    try {
      await deleteCollection(collectionId)
    } catch {
      // Error handled by hook
    }
  }

  if (isLoading) {
    return (
      <div data-testid="collections-loading" className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 rounded-lg">
        <p className="text-red-600 mb-4">{error}</p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Your Collections ({collections.length})
        </h2>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} className="mr-2" />
          New Collection
        </button>
      </div>

      {/* Empty State */}
      {collections.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <BookOpen size={40} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create collections to organise your favourite exercises into custom groups.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Create Collection
          </button>
        </div>
      ) : (
        /* Collection Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <Link
                href={`/dashboard/exercises/collections/${collection.id}`}
                className="block p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Folder size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {collection.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-0.5">
                        <Hash size={12} className="mr-1" />
                        {collection.exerciseIds.length} exercise{collection.exerciseIds.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500 mt-1" />
                </div>

                {collection.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{collection.description}</p>
                )}
              </Link>

              {/* Actions */}
              <div className="px-5 pb-4 flex items-center justify-end space-x-1 border-t border-gray-100 pt-3">
                <Link
                  href={`/dashboard/exercises/collections/${collection.id}`}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                  title="Edit collection"
                >
                  <Edit3 size={15} />
                </Link>
                <button
                  onClick={() => handleDelete(collection.id, collection.name)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                  title="Delete collection"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Create collection"
        >
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Collection</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="collection-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Collection name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
                />
              </div>

              <div>
                <label htmlFor="collection-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="collection-desc"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe this collection..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>

              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseCreate}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || !newName.trim()}
                className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isCreating && <Loader2 size={14} className="mr-2 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
