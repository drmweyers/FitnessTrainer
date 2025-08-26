'use client'

import { useState } from 'react'
import { Plus, MessageSquare } from 'lucide-react'

interface NotesSectionProps {
  notes: Array<{
    id: string
    date: string
    text: string
  }>
}

export default function NotesSection({ notes }: NotesSectionProps) {
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  
  const handleAddNote = () => {
    // In a real app, this would call an API to save the note
    setNewNote('')
    setIsAddingNote(false)
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800">Session Notes</h2>
        <button 
          className="text-blue-600 text-sm flex items-center"
          onClick={() => setIsAddingNote(true)}
        >
          <Plus size={16} className="mr-1" />
          Add Note
        </button>
      </div>
      
      {isAddingNote && (
        <div className="mb-4 border border-gray-200 rounded-md p-3">
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Enter your note here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          ></textarea>
          <div className="mt-2 flex justify-end space-x-2">
            <button 
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              onClick={() => setIsAddingNote(false)}
            >
              Cancel
            </button>
            <button 
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md"
              onClick={handleAddNote}
              disabled={!newNote.trim()}
            >
              Save Note
            </button>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">No notes yet</p>
          </div>
        ) : (
          notes.map(note => (
            <div key={note.id} className="border border-gray-200 rounded-md p-3">
              <div className="text-sm text-gray-700">{note.text}</div>
              <div className="mt-2 text-xs text-gray-500">
                {new Date(note.date).toLocaleDateString('en-US', { 
                  year: 'numeric',
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}