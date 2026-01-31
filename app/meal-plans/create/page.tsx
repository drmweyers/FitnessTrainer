'use client'

import { useState } from 'react'
import MealPlanForm from '@/components/features/MealPlan/MealPlanForm'
import Layout from '@/components/layout/Layout'

export default function CreateMealPlanPage() {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Create Meal Plan</h1>
          <p className="text-gray-600">Create a new meal plan to share with your clients</p>
        </div>
        
        <MealPlanForm />
      </div>
    </Layout>
  )
}