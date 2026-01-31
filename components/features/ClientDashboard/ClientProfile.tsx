'use client'

import Image from 'next/image'
import { Mail, Phone, Calendar, Camera } from 'lucide-react'

// Update the interface to match all client properties used in the component
interface ClientProfileProps {
  client: {
    id: string
    name: string
    age: number
    email: string
    phone: string
    joinDate: string
    profileImage: string
    progressPhotos: Array<{
      id: string
      date: string
      url: string
    }>
    // Add other properties that might be used in the component
    goals?: Array<{
      id: string
      text: string
      completed: boolean
    }>
    metrics?: {
      weight: Array<{ date: string, value: number }>
      bodyFat: Array<{ date: string, value: number }>
      muscleMass: Array<{ date: string, value: number }>
    }
    workouts?: Array<{
      id: string
      date: string
      name: string
      completed: boolean
      exercises: number
      completedExercises: number
      duration: number
    }>
    notes?: Array<{
      id: string
      date: string
      text: string
    }>
    limitations?: Array<{
      id: string
      text: string
    }>
    upcomingWorkouts?: Array<{
      id: string
      date: string
      name: string
      scheduled: boolean
    }>
  }
}

export default function ClientProfile({ client }: ClientProfileProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="absolute -bottom-12 left-4">
          <div className="relative h-24 w-24 rounded-full border-4 border-white overflow-hidden">
            <Image
              src={client.profileImage}
              alt={client.name}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
      
      <div className="pt-14 pb-4 px-4">
        <h2 className="text-xl font-bold text-gray-800">{client.name}</h2>
        <p className="text-sm text-gray-500">Age: {client.age}</p>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm">
            <Mail size={16} className="text-gray-400 mr-2" />
            <span className="text-gray-700">{client.email}</span>
          </div>
          <div className="flex items-center text-sm">
            <Phone size={16} className="text-gray-400 mr-2" />
            <span className="text-gray-700">{client.phone}</span>
          </div>
          <div className="flex items-center text-sm">
            <Calendar size={16} className="text-gray-400 mr-2" />
            <span className="text-gray-700">Client since {new Date(client.joinDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Progress Photos</h3>
          <button className="text-xs text-blue-600 flex items-center">
            <Camera size={14} className="mr-1" />
            Add Photo
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {client.progressPhotos.map((photo, index) => (
            <div key={photo.id} className="relative h-20 rounded-md overflow-hidden">
              <Image
                src={photo.url}
                alt={`Progress photo ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5">
                {new Date(photo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}