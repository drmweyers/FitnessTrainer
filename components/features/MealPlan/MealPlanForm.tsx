'use client'

import { useState } from 'react'
import ImageUploader from './ImageUploader'
import TextInput from '@/components/shared/TextInput'
import NumberInput from '@/components/shared/NumberInput'
import DropdownSelect from '@/components/shared/DropdownSelect'
import { Button } from '@/components/shared/Button'

interface MealPlanFormData {
  coverImage: File | null
  name: string
  weeks: number
  owner: string
  shareWithOrg: boolean
}

export default function MealPlanForm() {
  const [formData, setFormData] = useState<MealPlanFormData>({
    coverImage: null,
    name: '',
    weeks: 1,
    owner: 'me',
    shareWithOrg: false
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const handleImageUpload = (file: File) => {
    setFormData({
      ...formData,
      coverImage: file
    })
    
    // Clear any previous error
    if (errors.coverImage) {
      const newErrors = { ...errors }
      delete newErrors.coverImage
      setErrors(newErrors)
    }
  }
  
  const handleInputChange = (name: string, value: string | number | boolean) => {
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear any previous error
    if (errors[name]) {
      const newErrors = { ...errors }
      delete newErrors[name]
      setErrors(newErrors)
    }
  }
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.coverImage) {
      newErrors.coverImage = 'Please upload a cover image'
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter a meal plan name'
    } else if (formData.name.length > 90) {
      newErrors.name = 'Name must be 90 characters or less'
    }
    
    if (formData.weeks < 1) {
      newErrors.weeks = 'Number of weeks must be at least 1'
    } else if (formData.weeks > 12) {
      newErrors.weeks = 'Number of weeks cannot exceed 12'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      console.log('Form submitted:', formData)
      
      // Redirect or show success message
      alert('Meal plan created successfully!')
      
      // Reset form
      setFormData({
        coverImage: null,
        name: '',
        weeks: 1,
        owner: 'me',
        shareWithOrg: false
      })
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors({
        submit: 'Failed to create meal plan. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Mock data for owner dropdown
  const ownerOptions = [
    { value: 'me', label: 'Me (John Doe)' },
    { value: 'org', label: 'Organization' },
    { value: 'user1', label: 'Sarah Johnson' },
    { value: 'user2', label: 'Michael Smith' }
  ]
  
  // Mock data for share options
  const shareOptions = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' }
  ]
  
  return (
    <div className="bg-white rounded-lg shadow-sm max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
              Cover Image
            </label>
            <ImageUploader 
              onImageUpload={handleImageUpload} 
              currentImage={formData.coverImage}
              error={errors.coverImage}
            />
          </div>
          
          <div>
            <TextInput
              label="Meal Plan Name"
              name="name"
              value={formData.name}
              onChange={(value) => handleInputChange('name', value)}
              maxLength={90}
              showCharCount
              error={errors.name}
              placeholder="Enter a name for your meal plan"
            />
          </div>
          
          <div>
            <NumberInput
              label="Number of Weeks"
              name="weeks"
              value={formData.weeks}
              onChange={(value) => handleInputChange('weeks', value)}
              min={1}
              max={12}
              error={errors.weeks}
            />
          </div>
          
          <div>
            <DropdownSelect
              label="Owner"
              name="owner"
              value={formData.owner}
              onChange={(value) => handleInputChange('owner', value)}
              options={ownerOptions}
              error={errors.owner}
            />
          </div>
          
          <div>
            <DropdownSelect
              label="Share with Org?"
              name="shareWithOrg"
              value={formData.shareWithOrg}
              onChange={(value) => handleInputChange('shareWithOrg', value)}
              options={shareOptions}
              error={errors.shareWithOrg}
            />
          </div>
          
          {errors.submit && (
            <div className="text-red-500 text-sm">{errors.submit}</div>
          )}
          
          <div className="pt-4">
            <Button
              text="Create"
              isSubmitting={isSubmitting}
              fullWidth
            />
          </div>
        </div>
      </form>
    </div>
  )
}