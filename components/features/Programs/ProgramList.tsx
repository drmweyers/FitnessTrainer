'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProgramCard from './ProgramCard'
import BulkAssignmentModal from './BulkAssignmentModal'
import { 
  Program, 
  ProgramFilters as ProgramFiltersType,
  ProgramType,
  DifficultyLevel 
} from '@/types/program'
import { fetchPrograms, deleteProgram, duplicateProgram } from '@/lib/api/programs'
import { Loader2, Plus, Users, Calendar, AlertCircle } from 'lucide-react'
import { useToast, ToastContainer } from '@/components/shared/Toast'

interface ProgramListProps {
  filters: ProgramFiltersType
  viewMode: 'grid' | 'list'
}

export default function ProgramList({ filters, viewMode }: ProgramListProps) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignmentModal, setAssignmentModal] = useState<{
    isOpen: boolean;
    program: Program | null;
  }>({ isOpen: false, program: null })
  const router = useRouter()
  const { toasts, success, error: showError, removeToast } = useToast()

  const loadPrograms = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check authentication
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const data = await fetchPrograms(token, filters)
      setPrograms(data)
    } catch (err) {
      console.error('Error loading programs:', err)
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          localStorage.removeItem('accessToken')
          router.push('/auth/login')
          return
        }
        setError(err.message)
      } else {
        setError('Failed to load programs')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrograms()
  }, [filters])

  const handleEdit = (program: Program) => {
    router.push(`/programs/${program.id}/edit`)
  }

  const handleDuplicate = async (program: Program) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/auth/login')
        return
      }

      await duplicateProgram(program.id, token, `${program.name} (Copy)`)
      
      // Reload programs to show the duplicate
      await loadPrograms()
    } catch (err) {
      console.error('Error duplicating program:', err)
      setError(err instanceof Error ? err.message : 'Failed to duplicate program')
    }
  }

  const handleDelete = async (program: Program) => {
    if (!confirm(`Are you sure you want to delete "${program.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/auth/login')
        return
      }

      await deleteProgram(program.id, token)
      
      // Remove from state immediately for better UX
      setPrograms(prev => prev.filter(p => p.id !== program.id))
    } catch (err) {
      console.error('Error deleting program:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete program')
      // Reload programs in case of error to restore state
      await loadPrograms()
    }
  }

  const handleAssign = (program: Program) => {
    setAssignmentModal({ isOpen: true, program })
  }

  const handleBulkAssign = async (clientIds: string[], customizations: any) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const programId = assignmentModal.program?.id
      if (!programId) return

      // Assign program to each selected client via API
      const assignPromises = clientIds.map(clientId =>
        fetch(`/api/programs/${programId}/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            clientId,
            startDate: new Date(customizations.startDate).toISOString(),
          }),
        }).then(res => {
          if (!res.ok) throw new Error(`Failed to assign to client ${clientId}`);
          return res.json();
        })
      )

      await Promise.all(assignPromises)

      // Show success notification
      success(
        'Program Assigned Successfully!',
        `"${assignmentModal.program?.name}" has been assigned to ${clientIds.length} client${clientIds.length !== 1 ? 's' : ''}.`,
        6000
      )

      // Clear any existing errors
      setError(null)

      // Close modal
      setAssignmentModal({ isOpen: false, program: null })

      // Reload programs to update assignment counts
      await loadPrograms()

    } catch (err) {
      console.error('Error assigning program:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign program'
      showError('Assignment Failed', errorMessage)
      setError(errorMessage)
    }
  }

  const handleCreateProgram = () => {
    router.push('/programs/new')
  }

  // Filter programs based on client-side filters (for immediate response)
  const filteredPrograms = React.useMemo(() => {
    return programs.filter(program => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          program.name.toLowerCase().includes(searchLower) ||
          program.description?.toLowerCase().includes(searchLower) ||
          program.goals?.some(goal => goal.toLowerCase().includes(searchLower)) ||
          program.equipmentNeeded?.some(eq => eq.toLowerCase().includes(searchLower))
        
        if (!matchesSearch) return false
      }

      if (filters.programType && program.programType !== filters.programType) {
        return false
      }

      if (filters.difficultyLevel && program.difficultyLevel !== filters.difficultyLevel) {
        return false
      }

      if (filters.isTemplate !== undefined && program.isTemplate !== filters.isTemplate) {
        return false
      }

      return true
    })
  }, [programs, filters])

  // Sort programs
  const sortedPrograms = React.useMemo(() => {
    const sorted = [...filteredPrograms]
    
    const sortBy = filters.sortBy || 'createdAt'
    const sortOrder = filters.sortOrder || 'desc'

    sorted.sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]

      if (sortBy === 'name') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      } else if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return sorted
  }, [filteredPrograms, filters.sortBy, filters.sortOrder])

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading programs...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-red-800 font-medium">Error Loading Programs</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => loadPrograms()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Empty State
  if (sortedPrograms.length === 0) {
    const hasFilters = Object.keys(filters).some(key => filters[key as keyof ProgramFiltersType] !== undefined)
    
    return (
      <div className="text-center py-12">
        {hasFilters ? (
          <>
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No programs match your filters</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or clear the filters to see all programs.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No programs yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first training program. You can build custom workouts and assign them to clients.
            </p>
            <button
              onClick={handleCreateProgram}
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={20} />
              Create Your First Program
            </button>
          </>
        )}
      </div>
    )
  }

  // Results Summary
  const totalCount = programs.length
  const filteredCount = sortedPrograms.length
  const showingSummary = filteredCount !== totalCount

  return (
    <div>
      {/* Results Summary */}
      {showingSummary && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredCount} of {totalCount} programs
        </div>
      )}

      {/* Programs Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              viewMode="grid"
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onAssign={handleAssign}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              viewMode="list"
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onAssign={handleAssign}
            />
          ))}
        </div>
      )}

      {/* Load More / Pagination could go here */}
      
      {/* Bulk Assignment Modal */}
      {assignmentModal.program && (
        <BulkAssignmentModal
          program={assignmentModal.program}
          isOpen={assignmentModal.isOpen}
          onClose={() => setAssignmentModal({ isOpen: false, program: null })}
          onAssign={handleBulkAssign}
        />
      )}
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}