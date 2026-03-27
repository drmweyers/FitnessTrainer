/**
 * Push Notification Subscription API
 * POST /api/notifications/subscribe — save or remove push subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const subscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url('Invalid endpoint URL'),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  action: z.enum(['subscribe', 'unsubscribe']).default('subscribe'),
});

async function getRedisClient() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
    const { Redis } = await import('@upstash/redis');
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  try {
    const body = await request.json();
    const result = subscriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription data', details: result.error.errors },
        { status: 400 }
      );
    }

    const { subscription, action } = result.data;
    const redis = await getRedisClient();
    const key = `evofit:push-sub:${req.user!.id}`;

    if (action === 'unsubscribe') {
      if (redis) await redis.del(key);
      return NextResponse.json({ success: true, message: 'Unsubscribed from push notifications' });
    }

    if (redis) {
      await redis.set(key, JSON.stringify(subscription));
    }

    return NextResponse.json(
      { success: true, message: 'Successfully subscribed to push notifications' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[notifications/subscribe] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save push subscription' }, { status: 500 });
  }
}
