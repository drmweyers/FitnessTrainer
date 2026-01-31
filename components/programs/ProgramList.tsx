/**
 * ProgramList Component
 *
 * Displays a grid/list of programs with filtering and actions.
 */

'use client';

import { useState } from 'react';
import { usePrograms, useDeleteProgram, useDuplicateProgram } from '@/hooks/usePrograms';
import { ProgramType, DifficultyLevel } from '@/types/program';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Grid3X3, List, MoreVertical, Copy, Trash2, Edit, UserPlus } from 'lucide-react';
import Link from 'next/link';

export function ProgramList() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    search: '',
    programType: undefined as ProgramType | undefined,
    difficultyLevel: undefined as DifficultyLevel | undefined,
  });

  const { data: programs, isLoading, error } = usePrograms(filters);
  const deleteProgram = useDeleteProgram();
  const duplicateProgram = useDuplicateProgram();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this program?')) {
      try {
        await deleteProgram.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete program:', error);
      }
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateProgram.mutateAsync({ id });
    } catch (error) {
      console.error('Failed to duplicate program:', error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading programs...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-8">Failed to load programs</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search programs..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        <Select
          value={filters.programType || 'all'}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              programType: value === 'all' ? undefined : (value as ProgramType),
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Program Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={ProgramType.STRENGTH}>Strength</SelectItem>
            <SelectItem value={ProgramType.HYPERTROPHY}>Hypertrophy</SelectItem>
            <SelectItem value={ProgramType.ENDURANCE}>Endurance</SelectItem>
            <SelectItem value={ProgramType.POWERLIFTING}>Powerlifting</SelectItem>
            <SelectItem value={ProgramType.GENERAL_FITNESS}>General Fitness</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.difficultyLevel || 'all'}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              difficultyLevel: value === 'all' ? undefined : (value as DifficultyLevel),
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value={DifficultyLevel.BEGINNER}>Beginner</SelectItem>
            <SelectItem value={DifficultyLevel.INTERMEDIATE}>Intermediate</SelectItem>
            <SelectItem value={DifficultyLevel.ADVANCED}>Advanced</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <Link href="/programs/new">
          <Button>Create Program</Button>
        </Link>
      </div>

      {/* Programs Grid/List */}
      {!programs || programs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <p className="text-gray-500 mb-4">No programs found</p>
            <Link href="/programs/new">
              <Button>Create your first program</Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((program) => (
            <ProgramListItem
              key={program.id}
              program={program}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProgramCard({
  program,
  onDelete,
  onDuplicate,
}: {
  program: any;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{program.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link href={`/programs/${program.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(program.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/programs/${program.id}/assign`}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(program.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          {program.description || 'No description'}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
            {program.programType}
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
            {program.difficultyLevel}
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
            {program.durationWeeks} weeks
          </span>
        </div>
        <Link href={`/programs/${program.id}`}>
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ProgramListItem({
  program,
  onDelete,
  onDuplicate,
}: {
  program: any;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{program.name}</h3>
            <p className="text-sm text-gray-600">{program.description || 'No description'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {program.programType}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                {program.difficultyLevel}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                {program.durationWeeks} weeks
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/programs/${program.id}/edit`}>
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="icon" onClick={() => onDuplicate(program.id)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-red-600"
              onClick={() => onDelete(program.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
