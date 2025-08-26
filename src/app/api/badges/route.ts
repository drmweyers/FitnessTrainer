import { NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for badge creation
const createBadgeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().url('Invalid image URL'),
  category: z.string(),
  points: z.number().min(0, 'Points must be positive'),
  status: z.enum(['active', 'inactive'])
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createBadgeSchema.parse(body)
    
    // TODO: Replace with your actual database call
    // For now, we'll simulate a successful creation
    const newBadge = {
      id: crypto.randomUUID(),
      ...validatedData,
      dateEarned: null,
      progress: 0,
      criteria: null
    }
    
    // Return success response
    return NextResponse.json(newBadge, { status: 201 })
    
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      // Return validation errors
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    // Return generic error for any other type of error
    console.error('Badge creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create badge' },
      { status: 500 }
    )
  }
} 