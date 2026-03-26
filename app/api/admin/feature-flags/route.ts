import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/middleware/admin'

export const dynamic = 'force-dynamic'

interface FeatureFlag {
  id: string
  name: string
  description: string
  enabled: boolean
}

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    id: 'whatsapp_messaging',
    name: 'WhatsApp Messaging',
    description: 'Enable WhatsApp integration for client communication',
    enabled: true,
  },
  {
    id: 'pwa_features',
    name: 'PWA Features',
    description: 'Progressive Web App features (offline mode, install prompt)',
    enabled: true,
  },


]

const REDIS_KEY = 'evofit:feature-flags'

async function getRedisClient() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
    const { Redis } = await import('@upstash/redis')
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const redis = await getRedisClient()
    if (redis) {
      const stored = await redis.get<FeatureFlag[]>(REDIS_KEY)
      if (stored) {
        return NextResponse.json({ success: true, data: { flags: stored, source: 'redis' } })
      }
    }

    return NextResponse.json({ success: true, data: { flags: DEFAULT_FLAGS, source: 'default' } })
  } catch (error) {
    return NextResponse.json({ success: true, data: { flags: DEFAULT_FLAGS, source: 'default' } })
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await authenticateAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { flags } = body

    if (!flags || !Array.isArray(flags)) {
      return NextResponse.json({ success: false, error: 'flags must be an array' }, { status: 400 })
    }

    const redis = await getRedisClient()
    if (!redis) {
      return NextResponse.json(
        { success: false, error: 'Redis not available. Feature flags cannot be persisted server-side.' },
        { status: 503 }
      )
    }

    await redis.set(REDIS_KEY, flags)

    return NextResponse.json({ success: true, data: { flags, source: 'redis' } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save feature flags' }, { status: 500 })
  }
}
