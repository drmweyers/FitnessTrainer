/**
 * Analytics Measurements (Me) API Routes
 * GET /api/analytics/measurements/me - List authenticated user's body measurements
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/analytics/measurements/me
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
    // since UserMeasurement model is not in the root Prisma schema
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
