/**
 * Analytics Measurements API Routes
 * GET /api/analytics/measurements - List authenticated user's body measurements (proxy to /me)
 * POST /api/analytics/measurements - Save a new body measurement
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const measurementSchema = z.object({
  measurementDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  bodyFatPercentage: z.number().min(0).max(100).optional(),
  muscleMass: z.number().positive().optional(),
  measurements: z
    .object({
      chest: z.number().positive().optional(),
      waist: z.number().positive().optional(),
      hips: z.number().positive().optional(),
      biceps: z.number().positive().optional(),
      thighs: z.number().positive().optional(),
      neck: z.number().positive().optional(),
      shoulders: z.number().positive().optional(),
      forearms: z.number().positive().optional(),
      calves: z.number().positive().optional(),
    })
    .optional(),
  notes: z.string().max(2000).optional(),
})

/**
 * GET /api/analytics/measurements
 * List the authenticated user's body measurements with optional time range filter
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const userId = req.user!.id
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange')

    // Calculate start date based on timeRange
    let startDate: Date | null = null
    if (timeRange) {
      const now = new Date()
      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '3m':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
          break
        case '6m':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
          break
        case '1y':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          break
      }
    }

    // Query user_measurements table using raw SQL
    let rows: Array<{
      id: string
      user_id: string
      height: number | null
      weight: number | null
      body_fat_percentage: number | null
      muscle_mass: number | null
      measurements: unknown
      recorded_at: Date
    }>

    if (startDate) {
      rows = await prisma.$queryRawUnsafe(
        `SELECT id, user_id, height, weight, body_fat_percentage, muscle_mass, measurements, recorded_at
         FROM user_measurements
         WHERE user_id = $1::uuid AND recorded_at >= $2
         ORDER BY recorded_at DESC`,
        userId,
        startDate
      )
    } else {
      rows = await prisma.$queryRawUnsafe(
        `SELECT id, user_id, height, weight, body_fat_percentage, muscle_mass, measurements, recorded_at
         FROM user_measurements
         WHERE user_id = $1::uuid
         ORDER BY recorded_at DESC`,
        userId
      )
    }

    const measurements = rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      measurementDate: row.recorded_at.toISOString().split('T')[0],
      height: row.height ? Number(row.height) : undefined,
      weight: row.weight ? Number(row.weight) : undefined,
      bodyFatPercentage: row.body_fat_percentage ? Number(row.body_fat_percentage) : undefined,
      muscleMass: row.muscle_mass ? Number(row.muscle_mass) : undefined,
      measurements: row.measurements || {},
      createdAt: row.recorded_at.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: measurements,
    })
  } catch (error) {
    console.error('Error fetching measurements:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch measurements' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/analytics/measurements
 * Save a new body measurement for the authenticated user
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const body = await request.json()
    const validation = measurementSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const userId = req.user!.id
    const recordedAt = new Date(data.measurementDate)
    const measurementsJson = data.measurements ? JSON.stringify(data.measurements) : null

    // Insert into user_measurements table using raw SQL
    // since UserMeasurement model is not in the root Prisma schema
    const result = await prisma.$queryRaw<
      Array<{
        id: string
        user_id: string
        height: number | null
        weight: number | null
        body_fat_percentage: number | null
        muscle_mass: number | null
        measurements: unknown
        recorded_at: Date
      }>
    >`
      INSERT INTO user_measurements (user_id, height, weight, body_fat_percentage, muscle_mass, measurements, recorded_at)
      VALUES (
        ${userId}::uuid,
        ${data.height ?? null},
        ${data.weight ?? null},
        ${data.bodyFatPercentage ?? null},
        ${data.muscleMass ?? null},
        ${measurementsJson}::jsonb,
        ${recordedAt}
      )
      RETURNING id, user_id, height, weight, body_fat_percentage, muscle_mass, measurements, recorded_at
    `

    if (!result || result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to create measurement' },
        { status: 500 }
      )
    }

    const row = result[0]
    const measurement = {
      id: row.id,
      userId: row.user_id,
      measurementDate: row.recorded_at.toISOString().split('T')[0],
      height: row.height ? Number(row.height) : undefined,
      weight: row.weight ? Number(row.weight) : undefined,
      bodyFatPercentage: row.body_fat_percentage ? Number(row.body_fat_percentage) : undefined,
      muscleMass: row.muscle_mass ? Number(row.muscle_mass) : undefined,
      measurements: row.measurements || {},
      createdAt: row.recorded_at.toISOString(),
    }

    return NextResponse.json({ success: true, data: measurement }, { status: 201 })
  } catch (error) {
    console.error('Error creating measurement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create measurement' },
      { status: 500 }
    )
  }
}
