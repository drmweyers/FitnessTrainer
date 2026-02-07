/**
 * ProgramTemplates Component
 *
 * Gallery of program templates that trainers can use as starting points.
 */

'use client';

import { useState } from 'react';
import { useTemplates } from '@/hooks/useProgramTemplates';
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
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Copy, Star } from 'lucide-react';
import type { ProgramTemplate } from '@/types/program';

interface ProgramTemplatesProps {
  onSelectTemplate: (template: ProgramTemplate) => void;
  onClose?: () => void;
}

export function ProgramTemplates({ onSelectTemplate, onClose }: ProgramTemplatesProps) {
  const { data: templates, isLoading } = useTemplates();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = [
    'strength',
    'hypertrophy',
    'fat_loss',
    'muscle_gain',
    'endurance',
    'powerlifting',
    'bodybuilding',
    'general_fitness',
  ];

  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || template.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Program Templates</h2>
          <p className="text-gray-600">Start with a template and customize it</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat
                  .split('_')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading templates...</p>
        </div>
      ) : !filteredTemplates || filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <p className="text-gray-500 mb-4">No templates found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => onSelectTemplate(template)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: ProgramTemplate;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            {template.category && (
              <Badge variant="secondary" className="mt-2">
                {template.category}
              </Badge>
            )}
          </div>
          {template.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{template.rating}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {template.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{template.program?.difficultyLevel}</Badge>
          <Badge variant="outline">{template.program?.durationWeeks} weeks</Badge>
        </div>

        {template.goals && template.goals.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.goals.slice(0, 3).map((goal) => (
              <Badge key={goal} variant="secondary" className="text-xs">
                {goal}
              </Badge>
            ))}
          </div>
        )}

        {template.equipmentNeeded && template.equipmentNeeded.length > 0 && (
          <div className="text-xs text-gray-500">
            Equipment: {template.equipmentNeeded.slice(0, 3).join(', ')}
            {template.equipmentNeeded.length > 3 && '...'}
          </div>
        )}

        {template.usageCount !== undefined && (
          <p className="text-xs text-gray-500">
            Used by {template.usageCount} trainer{template.usageCount !== 1 ? 's' : ''}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" className="flex-1">
            <Copy className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
