'use client'

import { useState } from 'react'
import { Input } from '@/components/shared/Input'
import { Textarea } from '@/components/shared/Textarea'
import NumberInput from '@/components/shared/NumberInput'
import { Button } from '@/components/shared/Button'
import { Image } from 'lucide-react'

interface LevelFormProps {
  initialData?: {
    name: string
    description: string
    numChallenges: number
    thumbnailUrl: string
  }
  onSubmit: (data: any) => void
  isSubmitting?: boolean
}

export default function LevelForm({ 
  initialData, 
  onSubmit,
  isSubmitting = false
}: LevelFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    numChallenges: initialData?.numChallenges || 0,
    thumbnailUrl: initialData?.thumbnailUrl || '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const handleTextChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
  
  const handleNumberChange = (value: number) => {
    setFormData(prev => ({ ...prev, numChallenges: value }))
    
    // Clear error when field is edited
    if (errors.numChallenges) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.numChallenges
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
    
    if (formData.numChallenges < 0) {
      newErrors.numChallenges = 'Number of challenges must be positive'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    onSubmit(formData)
  }
  
  // Image type options for dropdown
  const imageTypeOptions = [
    { value: 'url', label: 'URL' },
    { value: 'upload', label: 'Upload' },
  ]
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Level Name"
        name="name"
        value={formData.name}
        onChange={handleTextChange('name')}
        placeholder="Enter level name"
        maxLength={50}
        showCharCount
        error={errors.name}
      />
      
      <Textarea
        id="description"
        name="description"
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        placeholder="Enter level description"
        className="min-h-[120px]"
        error={errors.description}
      />
      
      <NumberInput
        label="Number of Challenges"
        name="numChallenges"
        value={formData.numChallenges}
        onChange={handleNumberChange}
        min={0}
        max={100}
        step={1}
        error={errors.numChallenges}
      />
      
      <Input
        label="Thumbnail URL"
        name="thumbnailUrl"
        value={formData.thumbnailUrl}
        onChange={handleTextChange('thumbnailUrl')}
        placeholder="https://example.com/image.jpg"
        leftIcon={<Image size={16} />}
        error={errors.thumbnailUrl}
      />
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        
        <Button
          variant="submit"
          type="submit"
          isSubmitting={isSubmitting}
          text={initialData ? 'Update Level' : 'Create Level'}
        />
      </div>
    </form>
  )
}