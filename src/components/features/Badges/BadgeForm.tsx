'use client'

import { useState } from 'react'
import { Card } from '@/components/shared'
import { Input } from '@/components/shared/Input'
import { Textarea } from '@/components/shared/Textarea'
import NumberInput from '@/components/shared/NumberInput'
import { Button } from '@/components/shared/Button'
import { Badge } from '@/types/badge'

interface BadgeFormData {
  name: string
  description: string
  imageUrl: string
  category: string
  points: number
  status: 'active' | 'inactive'
}

interface BadgeFormProps {
  initialData?: Partial<BadgeFormData>
  onSubmit: (data: BadgeFormData) => void
  isSubmitting?: boolean
}

const CATEGORIES = [
  'Achievement',
  'Streak',
  'Nutrition',
  'Strength',
  'Lifestyle',
  'Other'
]

export default function BadgeForm({ 
  initialData, 
  onSubmit,
  isSubmitting = false
}: BadgeFormProps) {
  const [formData, setFormData] = useState<BadgeFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    imageUrl: initialData?.imageUrl || '',
    category: initialData?.category || CATEGORIES[0],
    points: initialData?.points ?? 0,
    status: initialData?.status || 'active'
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const handleChange = (field: keyof BadgeFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    
    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Image URL is required'
    } else {
      try {
        new URL(formData.imageUrl)
      } catch {
        newErrors.imageUrl = 'Please enter a valid URL'
      }
    }

    if (formData.points < 0) {
      newErrors.points = 'Points must be positive'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    onSubmit(formData)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Input
              label="Badge Name"
              name="name"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="Enter badge name"
              maxLength={50}
              showCharCount
              error={errors.name}
            />
            
            <Input
              label="Image URL"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange('imageUrl')}
              placeholder="Enter badge image URL (e.g., https://example.com/badge.png)"
              error={errors.imageUrl}
            />
          </div>
          
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange('description')}
            placeholder="Enter badge description"
            className="min-h-[120px]"
            error={errors.description}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={handleChange('category')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <NumberInput
              label="Points"
              name="points"
              value={formData.points}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, points: value }))
                if (errors.points) {
                  setErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors.points
                    return newErrors
                  })
                }
              }}
              min={0}
              max={10000}
              error={errors.points}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={handleChange('status')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => window.history.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            variant="default"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Badge'}
          </Button>
        </div>
      </Card>
    </form>
  )
} 