/**
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events. Only checkout.session.completed is implemented
 * for tier provisioning. Signature verification uses STRIPE_WEBHOOK_SECRET; if
 * the secret is absent in dev, verification is skipped with a warning.
 *
 * Ported from FitnessMealPlanner StripeWebhookHandler.ts — adapted for Prisma.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db/prisma';
import { TIER_PRICING, LEVEL_BY_TIER } from '@/lib/subscription/tiers';
import { invalidateCache } from '@/lib/subscription/EntitlementsService';

export const dynamic = 'force-dynamic';

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-02-25.clover' as any,
  });
}

async function constructEvent(req: NextRequest): Promise<Stripe.Event> {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('STRIPE_WEBHOOK_SECRET is required in production — set it in Vercel env vars');
    }
    console.warn('[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — skipping verification (dev only)');
    return JSON.parse(rawBody) as Stripe.Event;
  }

  return getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const trainerId = session.metadata?.trainerId;
  const tierFromMeta = session.metadata?.tier;

  // Resolve tier: prefer metadata.tier, fall back to price ID lookup
  const lineItemPriceId =
    (session as any).line_items?.data?.[0]?.price?.id ??
    (session as any).amount_total != null ? null : null;

  const tier = tierFromMeta ?? (lineItemPriceId ? TIER_PRICING[lineItemPriceId] : undefined);

  if (!trainerId || !tier) {
    console.warn('[stripe-webhook] Missing trainerId or tier in session metadata', session.id);
    return;
  }

  if (!(tier in LEVEL_BY_TIER)) {
    console.warn('[stripe-webhook] Unknown tier in metadata:', tier);
    return;
  }

  const tierLevel = LEVEL_BY_TIER[tier as keyof typeof LEVEL_BY_TIER];
  const amountPaidCents = session.amount_total ?? 0;
  const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
  const stripePaymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;

  // Upsert: mark any existing active subscription inactive, then create new one
  await prisma.trainerSubscription.updateMany({
    where: { trainerId, status: 'active' },
    data: { status: 'inactive' },
  });

  await prisma.trainerSubscription.create({
    data: {
      trainerId,
      tierLevel,
      status: 'active',
      stripePaymentIntentId,
      stripeSubscriptionId,
      amountPaidCents,
    },
  });

  // Bust the in-process entitlements cache so next request gets fresh data
  invalidateCache(trainerId);

  console.log(`[stripe-webhook] Provisioned ${tier} (level ${tierLevel}) for trainer ${trainerId}`);
}

export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  try {
    event = await constructEvent(request);
  } catch (err: any) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        // Other events not handled in this stream; silently ack
        break;
    }

    return NextResponse.json({ success: true, received: true });
  } catch (err: any) {
    console.error('[stripe-webhook] Handler error:', err.message);
    return NextResponse.json({ success: false, error: 'Webhook handler failed' }, { status: 500 });
  }
}
