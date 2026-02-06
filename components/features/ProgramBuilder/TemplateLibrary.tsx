'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Star,
  Filter,
  Copy,
  Eye,
  Users,
  Clock,
  Target,
  TrendingUp,
  Download,
  Share2,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Award,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { ProgramType, DifficultyLevel, ProgramData } from '@/types/program';
import { getTemplates } from '@/lib/api/programs';

interface TemplateLibraryProps {
  onSelectTemplate: (template: ProgramTemplate) => void;
  onClose?: () => void;
}

interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  programType: ProgramType;
  difficultyLevel: DifficultyLevel;
  durationWeeks: number;
  totalWorkouts: number;
  totalExercises: number;
  rating: number;
  reviewCount: number;
  useCount: number;
  tags: string[];
  creator: {
    name: string;
    verified: boolean;
  };
  createdAt: string;
  category: string;
  isBookmarked: boolean;
  thumbnail?: string;
  preview: {
    weekSample: string;
    workoutSample: string;
  };
}

const CATEGORIES = ['All Categories', 'Strength Training', 'Bodybuilding', 'Powerlifting', 'CrossFit', 'Calisthenics', 'Cardio'];

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  onClose
}) => {
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'useCount' | 'newest'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const category = selectedCategory !== 'All Categories' ? selectedCategory : undefined;
        const data = await getTemplates(token || undefined, category);
        // Map API response to the local ProgramTemplate shape
        const mapped: ProgramTemplate[] = data.map((t: any) => ({
          id: t.id,
          name: t.name || t.program?.name || 'Untitled',
          description: t.description || t.program?.description || '',
          programType: t.program?.programType || ProgramType.STRENGTH,
          difficultyLevel: t.program?.difficultyLevel || DifficultyLevel.BEGINNER,
          durationWeeks: t.program?.durationWeeks || 4,
          totalWorkouts: 0,
          totalExercises: 0,
          rating: t.rating || 0,
          reviewCount: 0,
          useCount: t.useCount || t.usageCount || 0,
          tags: t.tags || [],
          creator: {
            name: t.creator?.email || 'Unknown',
            verified: true,
          },
          createdAt: t.createdAt || '',
          category: t.category || 'Uncategorized',
          isBookmarked: false,
          preview: {
            weekSample: '',
            workoutSample: '',
          },
        }));
        setTemplates(mapped);
      } catch (err) {
        console.error('Failed to load templates:', err);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, [selectedCategory]);

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All Categories' || template.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || template.difficultyLevel === selectedDifficulty;
      const matchesBookmark = !bookmarkedOnly || template.isBookmarked;

      return matchesSearch && matchesCategory && matchesDifficulty && matchesBookmark;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'useCount':
          return b.useCount - a.useCount;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER:
        return 'bg-green-100 text-green-800';
      case DifficultyLevel.INTERMEDIATE:
        return 'bg-yellow-100 text-yellow-800';
      case DifficultyLevel.ADVANCED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleBookmark = (templateId: string) => {
    // In real app, this would call an API
    console.log('Toggle bookmark for template:', templateId);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Program Template Library</h2>
          <p className="text-gray-600 mt-2">
            Browse and select from professionally designed training programs
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" leftIcon={<Share2 size={16} />}>
            Share Library
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose} leftIcon={<X size={16} />}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search templates, tags, creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter size={16} />}
          >
            Filters {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>

        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel | 'all')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Levels</option>
                <option value={DifficultyLevel.BEGINNER}>Beginner</option>
                <option value={DifficultyLevel.INTERMEDIATE}>Intermediate</option>
                <option value={DifficultyLevel.ADVANCED}>Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'useCount' | 'newest')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="rating">Highest Rated</option>
                <option value="useCount">Most Popular</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bookmarkedOnly}
                  onChange={(e) => setBookmarkedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Bookmarked Only</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {loading ? 'Loading templates...' : `${filteredTemplates.length} template${filteredTemplates.length !== 1 ? 's' : ''} found`}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all">
            {/* Template Header */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    {template.creator.verified && (
                      <div title="Verified Creator">
                        <Award size={16} className="text-blue-500" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>by {template.creator.name}</span>
                    <span>•</span>
                    <span>{template.useCount.toLocaleString()} uses</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleBookmark(template.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {template.isBookmarked ? (
                    <BookmarkCheck size={20} className="text-blue-500" />
                  ) : (
                    <Bookmark size={20} className="text-gray-400" />
                  )}
                </button>
              </div>

              {/* Template Stats */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <Clock size={16} className="mx-auto mb-1 text-gray-400" />
                  <div className="text-sm font-medium text-gray-900">{template.durationWeeks}</div>
                  <div className="text-xs text-gray-600">weeks</div>
                </div>
                <div className="text-center">
                  <Target size={16} className="mx-auto mb-1 text-gray-400" />
                  <div className="text-sm font-medium text-gray-900">{template.totalWorkouts}</div>
                  <div className="text-xs text-gray-600">workouts</div>
                </div>
                <div className="text-center">
                  <TrendingUp size={16} className="mx-auto mb-1 text-gray-400" />
                  <div className="text-sm font-medium text-gray-900">{template.totalExercises}</div>
                  <div className="text-xs text-gray-600">exercises</div>
                </div>
                <div className="text-center">
                  <Star size={16} className="mx-auto mb-1 text-yellow-500" />
                  <div className="text-sm font-medium text-gray-900">{template.rating}</div>
                  <div className="text-xs text-gray-600">({template.reviewCount})</div>
                </div>
              </div>

              {/* Tags and Difficulty */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                  {template.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(template.difficultyLevel)}`}>
                  {template.difficultyLevel}
                </span>
              </div>

              {/* Preview */}
              {expandedTemplate === template.id && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Program Preview</h5>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div>
                      <span className="font-medium">Sample Week:</span> {template.preview.weekSample}
                    </div>
                    <div>
                      <span className="font-medium">Sample Workout:</span> {template.preview.workoutSample}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                  leftIcon={<Eye size={14} />}
                >
                  {expandedTemplate === template.id ? 'Hide Preview' : 'Preview'}
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Copy size={14} />}
                  >
                    Clone
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSelectTemplate(template)}
                    leftIcon={<Download size={14} />}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <Search size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All Categories');
              setSelectedDifficulty('all');
              setBookmarkedOnly(false);
            }}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;