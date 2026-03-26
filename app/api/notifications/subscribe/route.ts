/**
 * Push Notification Subscription API
 * POST /api/notifications/subscribe — save or remove push subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
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

/**
 * POST /api/notifications/subscribe
 * Saves or removes a Web Push subscription for the authenticated user.
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  try {
    const body = await request.json();
    const result = subscriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid subscription data',
          details: result.error.errors,
        },
        { status: 400 }
      );
    }

    const { subscription, action } = result.data;

    if (action === 'unsubscribe') {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { pushSubscription: null },
      });

      return NextResponse.json(
        { success: true, message: 'Unsubscribed from push notifications' },
        { status: 200 }
      );
    }

    // action === 'subscribe'
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { pushSubscription: JSON.stringify(subscription) },
    });

    return NextResponse.json(
      { success: true, message: 'Successfully subscribed to push notifications' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[notifications/subscribe] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save push subscription',
      },
      { status: 500 }
    );
  }
}
