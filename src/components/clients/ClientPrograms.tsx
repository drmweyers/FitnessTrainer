/**
 * ClientPrograms Component
 *
 * Displays programs assigned to a client with progress tracking.
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, BookOpen, Plus } from 'lucide-react';
import { ProgramAssignment } from '@/types/program';

interface ClientProgramsProps {
  clientId: string;
}

export function ClientPrograms({ clientId }: ClientProgramsProps) {
  // Mock assigned programs with progress - in real implementation, fetch from API
  const assignedPrograms: (ProgramAssignment & { progress?: number; upcomingWorkout?: string })[] = [
    {
      id: '1',
      programId: 'prog-1',
      clientId,
      trainerId: 'trainer-1',
      startDate: '2024-01-01',
      isActive: true,
      assignedAt: '2024-01-01T00:00:00.000Z',
      progress: 65,
      upcomingWorkout: 'Leg Day',
      program: {
        id: 'prog-1',
        name: '12-Week Strength Program',
        description: 'Comprehensive strength training program',
        durationWeeks: 12,
        programType: 'strength',
        difficultyLevel: 'intermediate',
      } as any,
    },
    {
      id: '2',
      programId: 'prog-2',
      clientId,
      trainerId: 'trainer-1',
      startDate: '2024-01-15',
      isActive: true,
      assignedAt: '2024-01-15T00:00:00.000Z',
      progress: 30,
      upcomingWorkout: 'HIIT Cardio',
      program: {
        id: 'prog-2',
        name: 'Fat Loss Challenge',
        description: 'High-intensity interval training for fat loss',
        durationWeeks: 8,
        programType: 'hiit',
        difficultyLevel: 'advanced',
      } as any,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Assigned Programs</h2>
          <p className="text-gray-600">Programs assigned to this client</p>
        </div>
        <Link href={`/programs?assign=${clientId}`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Assign Program
          </Button>
        </Link>
      </div>

      {/* Programs List */}
      {assignedPrograms.length > 0 ? (
        <div className="space-y-4">
          {assignedPrograms.map((assignment) => (
            <ProgramCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No programs assigned</p>
            <p className="text-sm text-gray-400 mb-4">
              Assign a program to start tracking client progress
            </p>
            <Link href={`/programs?assign=${clientId}`}>
              <Button>Browse Programs</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ProgramCardProps {
  assignment: ProgramAssignment & { progress?: number; upcomingWorkout?: string };
}

function ProgramCard({ assignment }: ProgramCardProps) {
  const startDate = new Date(assignment.startDate);
  const progress = assignment.progress || 0;
  const program = assignment.program;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{program?.name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {program?.description || 'No description'}
            </p>
          </div>
          <Link href={`/programs/${assignment.programId}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Program Info */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {program?.programType || 'General'}
          </Badge>
          <Badge variant="secondary">
            {program?.difficultyLevel || 'Intermediate'}
          </Badge>
          <Badge variant="secondary">
            {program?.durationWeeks || 0} Weeks
          </Badge>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
            <div>
              <p className="text-gray-500">Started</p>
              <p className="font-medium">{startDate.toLocaleDateString()}</p>
            </div>
          </div>
          {assignment.upcomingWorkout && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <div>
                <p className="text-gray-500">Up Next</p>
                <p className="font-medium">{assignment.upcomingWorkout}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
