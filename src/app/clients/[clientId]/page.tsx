'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import ClientProfile from '@/components/features/ClientDashboard/ClientProfile'
import TrainingOverview from '@/components/features/ClientDashboard/TrainingOverview'
import MetricsDisplay from '@/components/features/ClientDashboard/MetricsDisplay'
import NotesSection from '@/components/features/ClientDashboard/NotesSection'
import LimitationsSection from '@/components/features/ClientDashboard/LimitationsSection'
import WorkoutHistory from '@/components/features/ClientDashboard/WorkoutHistory'
import GoalsSection from '@/components/features/ClientDashboard/GoalsSection'

export default function ClientDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const params = useParams()
  const clientId = String(params.clientId)
  
  // Mock client data
  const client = {
    id: clientId,
    name: 'Sarah Johnson',
    age: 32,
    email: 'sarah.johnson@example.com',
    phone: '(555) 123-4567',
    joinDate: '2023-03-15',
    profileImage: 'https://picsum.photos/id/1027/200/200',
    goals: [
      { id: 'g1', text: 'Lose 10 pounds in 3 months', completed: false },
      { id: 'g2', text: 'Run a 5K under 30 minutes', completed: true },
      { id: 'g3', text: 'Improve overall strength', completed: false }
    ],
    metrics: {
      weight: [
        { date: '2023-03-15', value: 165 },
        { date: '2023-04-01', value: 163 },
        { date: '2023-04-15', value: 161 },
        { date: '2023-05-01', value: 160 },
        { date: '2023-05-15', value: 158 },
        { date: '2023-06-01', value: 157 }
      ],
      bodyFat: [
        { date: '2023-03-15', value: 28 },
        { date: '2023-04-01', value: 27.5 },
        { date: '2023-04-15', value: 27 },
        { date: '2023-05-01', value: 26.5 },
        { date: '2023-05-15', value: 26 },
        { date: '2023-06-01', value: 25.5 }
      ],
      muscleMass: [
        { date: '2023-03-15', value: 52 },
        { date: '2023-04-01', value: 52.5 },
        { date: '2023-04-15', value: 53 },
        { date: '2023-05-01', value: 53.5 },
        { date: '2023-05-15', value: 54 },
        { date: '2023-06-01', value: 54.5 }
      ]
    },
    workouts: [
      { 
        id: 'w1', 
        date: '2023-05-28', 
        name: 'Full Body Strength', 
        completed: true,
        exercises: 8,
        completedExercises: 8,
        duration: 65
      },
      { 
        id: 'w2', 
        date: '2023-05-25', 
        name: 'HIIT Cardio', 
        completed: true,
        exercises: 6,
        completedExercises: 6,
        duration: 45
      },
      { 
        id: 'w3', 
        date: '2023-05-22', 
        name: 'Upper Body Focus', 
        completed: true,
        exercises: 7,
        completedExercises: 5,
        duration: 55
      },
      { 
        id: 'w4', 
        date: '2023-05-19', 
        name: 'Lower Body & Core', 
        completed: true,
        exercises: 9,
        completedExercises: 9,
        duration: 70
      }
    ],
    progressPhotos: [
      { id: 'p1', date: '2023-03-15', url: 'https://picsum.photos/id/1060/300/400' },
      { id: 'p2', date: '2023-04-15', url: 'https://picsum.photos/id/1062/300/400' },
      { id: 'p3', date: '2023-05-15', url: 'https://picsum.photos/id/1063/300/400' }
    ],
    notes: [
      { id: 'n1', date: '2023-05-28', text: 'Client reported knee discomfort during squats. Modified to use leg press instead.' },
      { id: 'n2', date: '2023-05-15', text: 'Increased weight on all upper body exercises by 5 lbs. Client handled it well.' },
      { id: 'n3', date: '2023-05-01', text: 'Client missed last week due to business trip. Adjusted program to account for break.' }
    ],
    limitations: [
      { id: 'l1', text: 'Mild knee pain when doing deep squats' },
      { id: 'l2', text: 'Previous shoulder injury - avoid heavy overhead pressing' }
    ],
    upcomingWorkouts: [
      { 
        id: 'uw1', 
        date: '2023-06-01', 
        name: 'Full Body Circuit', 
        scheduled: true 
      },
      { 
        id: 'uw2', 
        date: '2023-06-04', 
        name: 'Cardio Endurance', 
        scheduled: true 
      }
    ]
  }
  
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800">{client.name}'s Dashboard</h1>
            <div className="ml-4 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Active Client
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button className="btn-secondary">Message</button>
            <button className="btn-primary">Create Workout</button>
          </div>
        </div>
        
        <div className="flex space-x-4 mb-6">
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'overview' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'workouts' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('workouts')}
          >
            Workouts
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'metrics' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('metrics')}
          >
            Metrics
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'notes' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('notes')}
          >
            Notes
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Client profile */}
          <div className="lg:col-span-1">
            <ClientProfile client={client} />
            <div className="mt-6">
              <LimitationsSection limitations={client.limitations} />
            </div>
          </div>
          
          {/* Main content area */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <>
                <TrainingOverview client={client} />
                <div className="mt-6">
                  <GoalsSection goals={client.goals} />
                </div>
              </>
            )}
            
            {activeTab === 'workouts' && (
              <WorkoutHistory workouts={client.workouts} />
            )}
            
            {activeTab === 'metrics' && (
              <MetricsDisplay metrics={client.metrics} />
            )}
            
            {activeTab === 'notes' && (
              <NotesSection notes={client.notes} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}