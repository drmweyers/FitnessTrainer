'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Play, 
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  MessageSquare,
  Target,
  TrendingUp,
  BarChart3,
  Settings,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';

interface ProgramAssignment {
  id: string;
  program: {
    id: string;
    name: string;
    description: string;
    durationWeeks: number;
    programType: string;
    difficultyLevel: string;
  };
  startDate: string;
  endDate: string;
  currentWeek: number;
  totalWeeks: number;
  progress: {
    completedWorkouts: number;
    totalWorkouts: number;
    adherenceRate: number;
    lastWorkoutDate?: string;
    nextWorkoutDate?: string;
  };
  customizations: {
    notes?: string;
    allowModifications: boolean;
    customDuration?: number;
  };
  status: 'active' | 'completed' | 'paused' | 'overdue';
  assignedBy: {
    name: string;
    id: string;
  };
  assignedAt: string;
}

interface ClientProgramDashboardProps {
  clientId: string;
}

const ClientProgramDashboard: React.FC<ClientProgramDashboardProps> = ({ clientId }) => {
  const [assignments, setAssignments] = useState<ProgramAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProgramAssignment['status']>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - in real app, fetch from API
  useEffect(() => {
    const mockAssignments: ProgramAssignment[] = [
      {
        id: '1',
        program: {
          id: 'prog-1',
          name: 'Strength Foundation Program',
          description: 'Build strength with compound movements',
          durationWeeks: 12,
          programType: 'strength',
          difficultyLevel: 'intermediate'
        },
        startDate: '2024-01-15',
        endDate: '2024-04-08',
        currentWeek: 6,
        totalWeeks: 12,
        progress: {
          completedWorkouts: 18,
          totalWorkouts: 36,
          adherenceRate: 85,
          lastWorkoutDate: '2024-02-20',
          nextWorkoutDate: '2024-02-22'
        },
        customizations: {
          notes: 'Focus on form over weight progression',
          allowModifications: true
        },
        status: 'active',
        assignedBy: {
          name: 'Coach Sarah',
          id: 'trainer-1'
        },
        assignedAt: '2024-01-10'
      },
      {
        id: '2',
        program: {
          id: 'prog-2',
          name: 'Cardio Conditioning',
          description: 'Improve cardiovascular endurance',
          durationWeeks: 8,
          programType: 'cardio',
          difficultyLevel: 'beginner'
        },
        startDate: '2024-02-01',
        endDate: '2024-03-26',
        currentWeek: 8,
        totalWeeks: 8,
        progress: {
          completedWorkouts: 24,
          totalWorkouts: 24,
          adherenceRate: 100,
          lastWorkoutDate: '2024-03-25'
        },
        customizations: {
          notes: 'Great job completing this program!',
          allowModifications: false
        },
        status: 'completed',
        assignedBy: {
          name: 'Coach Sarah',
          id: 'trainer-1'
        },
        assignedAt: '2024-01-28'
      }
    ];

    setAssignments(mockAssignments);
    setLoading(false);
  }, [clientId]);

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.program.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ProgramAssignment['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: ProgramAssignment['status']) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'paused':
        return <Clock className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewProgram = (assignment: ProgramAssignment) => {
    // Navigate to program details
    console.log('View program:', assignment.program.id);
  };

  const handleStartWorkout = (assignment: ProgramAssignment) => {
    // Navigate to workout tracker with assignment context
    window.location.href = `/workout-tracker?assignmentId=${assignment.id}&programId=${assignment.program.id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Training Programs</h1>
          <p className="text-gray-600 mt-1">Track your progress and access your assigned workouts</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Play className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Programs</p>
              <p className="text-2xl font-bold text-gray-900">
                {assignments.filter(a => a.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {assignments.filter(a => a.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avg. Adherence</p>
              <p className="text-2xl font-bold text-gray-900">
                {assignments.length > 0 ? 
                  Math.round(assignments.reduce((sum, a) => sum + a.progress.adherenceRate, 0) / assignments.length) : 0
                }%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Workouts</p>
              <p className="text-2xl font-bold text-gray-900">
                {assignments.reduce((sum, a) => sum + a.progress.completedWorkouts, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Programs</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by program name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Program Cards */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No programs found</h3>
            <p className="text-gray-600">
              {assignments.length === 0 
                ? "You don't have any assigned programs yet. Contact your trainer to get started."
                : "No programs match your current filters. Try adjusting your search criteria."
              }
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{assignment.program.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(assignment.status)}`}>
                        {getStatusIcon(assignment.status)}
                        <span className="ml-1 capitalize">{assignment.status}</span>
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{assignment.program.description}</p>
                    
                    {/* Assignment Info */}
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Week {assignment.currentWeek} of {assignment.totalWeeks}
                      </div>
                      <div>
                        Assigned by {assignment.assignedBy.name}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => handleViewProgram(assignment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    {assignment.status === 'active' && (
                      <Button onClick={() => handleStartWorkout(assignment)}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Workout
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-500">
                      {assignment.progress.completedWorkouts}/{assignment.progress.totalWorkouts} workouts
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(assignment.progress.completedWorkouts / assignment.progress.totalWorkouts) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-gray-500">
                      Adherence: <span className="font-medium">{assignment.progress.adherenceRate}%</span>
                    </span>
                    {assignment.progress.nextWorkoutDate && (
                      <span className="text-gray-500">
                        Next workout: {formatDate(assignment.progress.nextWorkoutDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Customizations/Notes */}
                {assignment.customizations.notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Trainer Notes</p>
                        <p className="text-sm text-blue-800">{assignment.customizations.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientProgramDashboard;