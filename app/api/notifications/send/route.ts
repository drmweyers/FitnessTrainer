/**
 * Push Notification Send API
 * POST /api/notifications/send — send a push notification to a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import webpush from 'web-push';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@evofittrainer.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const sendSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  title: z.string().min(1, 'title is required'),
  body: z.string().min(1, 'body is required'),
  url: z.string().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
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

  if (req.user?.role !== 'admin' && req.user?.role !== 'trainer') {
    return NextResponse.json(
      { success: false, error: 'Forbidden: admin or trainer role required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const result = sendSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification data', details: result.error.errors },
        { status: 400 }
      );
    }

    const { userId, title, body: notifBody, url, icon, badge } = result.data;

    const redis = await getRedisClient();
    const subJson = redis ? await redis.get<string>(`evofit:push-sub:${userId}`) : null;

    if (!subJson) {
      return NextResponse.json(
        { success: false, error: 'No subscription found for this user' },
        { status: 404 }
      );
    }

    const subscription = typeof subJson === 'string' ? JSON.parse(subJson) : subJson;

    const payload = JSON.stringify({
      title,
      body: notifBody,
      url: url || '/',
      icon: icon || '/icon-192.png',
      badge: badge || '/icon-192.png',
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true, message: 'Notification sent successfully' });
  } catch (error) {
    console.error('[notifications/send] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send push notification' }, { status: 500 });
  }
}
