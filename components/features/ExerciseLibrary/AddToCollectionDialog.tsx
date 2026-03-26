'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, Plus, Check, Folder, Loader2, BookOpen } from 'lucide-react'
import { useCollections } from '@/hooks/useCollections'

interface AddToCollectionDialogProps {
  /** The exercise being added to a collection */
  exerciseId: string
  /** Display name of the exercise (shown in dialog title) */
  exerciseName: string
  /** Whether the dialog is visible */
  isOpen: boolean
  /** Called when the dialog should close */
  onClose: () => void
}

/**
 * AddToCollectionDialog provides a modal for adding (or removing) an exercise
 * from any of the user's collections. Also allows creating a new collection inline.
 */
export function AddToCollectionDialog({
  exerciseId,
  exerciseName,
  isOpen,
  onClose,
}: AddToCollectionDialogProps) {
  const { collections, isLoading, createCollection, addToCollection, removeFromCollection, isInCollection } =
    useCollections()

  // Track which collections are currently selected (checked)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [original, setOriginal] = useState<Set<string>>(new Set())

  const [isSaving, setIsSaving] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)

  // Initialise selection state from hook each time the dialog opens
  useEffect(() => {
    if (isOpen && !isLoading) {
      const inCol = new Set(collections.filter((c) => isInCollection(c.id, exerciseId)).map((c) => c.id))
      setSelected(new Set(inCol))
      setOriginal(new Set(inCol))
    }
  }, [isOpen, isLoading, collections, exerciseId, isInCollection])

  const toggleCollection = useCallback((collectionId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(collectionId)) {
        next.delete(collectionId)
      } else {
        next.add(collectionId)
      }
      return next
    })
  }, [])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const toAdd = [...selected].filter((id) => !original.has(id))
      const toRemove = [...original].filter((id) => !selected.has(id))
      await Promise.all([
        ...toAdd.map((id) => addToCollection(id, exerciseId)),
        ...toRemove.map((id) => removeFromCollection(id, exerciseId)),
      ])
      onClose()
    } catch {
      // Allow user to retry
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateAndAdd = async () => {
    const trimmedName = newName.trim()
    if (!trimmedName) return
    try {
      setIsAddingNew(true)
      const newCol = await createCollection(trimmedName, '')
      await addToCollection(newCol.id, exerciseId)
      setSelected((prev) => new Set([...prev, newCol.id]))
      setOriginal((prev) => new Set([...prev, newCol.id]))
      setNewName('')
      setShowNewForm(false)
    } catch {
      // Error surfaced by hook
    } finally {
      setIsAddingNew(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={`Add ${exerciseName} to collection`}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Add <span className="text-blue-600">{exerciseName}</span> to…
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Collection list */}
        <div className="max-h-64 overflow-y-auto px-5 py-3 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-blue-500" />
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={28} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No collections yet — create one below.</p>
            </div>
          ) : (
            collections.map((collection) => {
              const checked = selected.has(collection.id)
              return (
                <label
                  key={collection.id}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <span className="relative flex items-center justify-center w-5 h-5">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleCollection(collection.id)}
                      aria-label={collection.name}
                    />
                    <span
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                        checked
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                    </span>
                  </span>
                  <span className="flex items-center flex-1 min-w-0">
                    <Folder size={15} className="text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-800 truncate">{collection.name}</span>
                    <span className="ml-auto text-xs text-gray-400 pl-2">
                      {collection.exerciseIds.length}
                    </span>
                  </span>
                </label>
              )
            })
          )}
        </div>

        {/* Create new collection inline */}
        <div className="px-5 py-3 border-t border-gray-100">
          {showNewForm ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name"
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAdd() }}
              />
              <button
                onClick={handleCreateAndAdd}
                disabled={isAddingNew || !newName.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                aria-label="Add"
              >
                {isAddingNew ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
              </button>
              <button
                onClick={() => { setShowNewForm(false); setNewName('') }}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus size={15} className="mr-1" />
              Create new collection
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSaving && <Loader2 size={14} className="mr-2 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
