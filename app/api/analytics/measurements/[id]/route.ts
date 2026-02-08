/**
 * Analytics Measurement by ID API Routes
 * PUT /api/analytics/measurements/[id] - Update a body measurement
 * DELETE /api/analytics/measurements/[id] - Delete a body measurement
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const updateMeasurementSchema = z.object({
  measurementDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .optional(),
  weight: z.number().positive().optional().nullable(),
  height: z.number().positive().optional().nullable(),
  bodyFatPercentage: z.number().min(0).max(100).optional().nullable(),
  muscleMass: z.number().positive().optional().nullable(),
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
    .optional()
    .nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

const uuidSchema = z.string().uuid('Invalid measurement ID')

/**
 * PUT /api/analytics/measurements/[id]
 * Update a body measurement owned by the authenticated user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    // Validate ID parameter
    const idValidation = uuidSchema.safeParse(params.id)
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid measurement ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validation = updateMeasurementSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const userId = req.user!.id
    const measurementId = params.id

    // Verify the measurement exists and belongs to the user
    const existing = await prisma.$queryRaw<
      Array<{ id: string; user_id: string }>
    >`
      SELECT id, user_id FROM user_measurements
      WHERE id = ${measurementId}::uuid AND user_id = ${userId}::uuid
    `

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Measurement not found' },
        { status: 404 }
      )
    }

    const data = validation.data

    // Build SET clauses dynamically for non-undefined fields
    const setClauses: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (data.weight !== undefined) {
      setClauses.push(`weight = $${paramIndex}`)
      values.push(data.weight)
      paramIndex++
    }

    if (data.height !== undefined) {
      setClauses.push(`height = $${paramIndex}`)
      values.push(data.height)
      paramIndex++
    }

    if (data.bodyFatPercentage !== undefined) {
      setClauses.push(`body_fat_percentage = $${paramIndex}`)
      values.push(data.bodyFatPercentage)
      paramIndex++
    }

    if (data.muscleMass !== undefined) {
      setClauses.push(`muscle_mass = $${paramIndex}`)
      values.push(data.muscleMass)
      paramIndex++
    }

    if (data.measurements !== undefined) {
      const measurementsJson = data.measurements ? JSON.stringify(data.measurements) : null
      setClauses.push(`measurements = $${paramIndex}::jsonb`)
      values.push(measurementsJson)
      paramIndex++
    }

    if (data.measurementDate !== undefined) {
      setClauses.push(`recorded_at = $${paramIndex}`)
      values.push(new Date(data.measurementDate))
      paramIndex++
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Add WHERE clause parameters
    values.push(measurementId)
    const idParam = paramIndex
    paramIndex++
    values.push(userId)
    const userIdParam = paramIndex

    const query = `
      UPDATE user_measurements
      SET ${setClauses.join(', ')}
      WHERE id = $${idParam}::uuid AND user_id = $${userIdParam}::uuid
      RETURNING id, user_id, height, weight, body_fat_percentage, muscle_mass, measurements, recorded_at
    `

    const result = await prisma.$queryRawUnsafe<
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
    >(query, ...values)

    if (!result || result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update measurement' },
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

    return NextResponse.json({ success: true, data: measurement })
  } catch (error) {
    console.error('Error updating measurement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update measurement' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/analytics/measurements/[id]
 * Delete a body measurement owned by the authenticated user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    // Validate ID parameter
    const idValidation = uuidSchema.safeParse(params.id)
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid measurement ID' },
        { status: 400 }
      )
    }

    const userId = req.user!.id
    const measurementId = params.id

    // Verify the measurement exists and belongs to the user
    const existing = await prisma.$queryRaw<
      Array<{ id: string; user_id: string }>
    >`
      SELECT id, user_id FROM user_measurements
      WHERE id = ${measurementId}::uuid AND user_id = ${userId}::uuid
    `

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Measurement not found' },
        { status: 404 }
      )
    }

    await prisma.$executeRaw`
      DELETE FROM user_measurements
      WHERE id = ${measurementId}::uuid AND user_id = ${userId}::uuid
    `

    return NextResponse.json({ success: true, message: 'Measurement deleted' })
  } catch (error) {
    console.error('Error deleting measurement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete measurement' },
      { status: 500 }
    )
  }
}
