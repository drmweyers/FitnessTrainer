/**
 * POST /api/create-checkout-session
 *
 * Creates a Stripe Checkout Session for EvoFit Trainer funnel purchases.
 * Supports one-time payments (tier purchases) and subscriptions (SaaS add-on).
 *
 * When both a tier and SaaS add-on are selected, uses subscription mode
 * with the tier as a one-time line item.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

// Valid price IDs for each tier
const VALID_PRICE_IDS: Record<string, string> = {
  starter: 'price_1TEwpaGo4HHYDfDVyvecwfMc',
  professional: 'price_1TEwpcGo4HHYDfDVqNAFCnDt',
  enterprise: 'price_1TEwpeGo4HHYDfDVe7M1XZTD',
  saas: 'price_1TEwpdGo4HHYDfDVmtIVLSQo',
};

// Tiers that are one-time payments
const ONE_TIME_TIERS = ['starter', 'professional', 'enterprise'];

interface CheckoutRequest {
  priceId: string;
  tier: string;
  saas?: boolean;
  saasPriceId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { priceId, tier, saas, saasPriceId } = body;

    // Validate required fields
    if (!priceId || !tier) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: priceId and tier' },
        { status: 400 }
      );
    }

    // Validate tier
    if (!ONE_TIME_TIERS.includes(tier)) {
      return NextResponse.json(
        { success: false, error: `Invalid tier: ${tier}` },
        { status: 400 }
      );
    }

    // Validate priceId matches tier
    if (VALID_PRICE_IDS[tier] !== priceId) {
      return NextResponse.json(
        { success: false, error: 'Price ID does not match the selected tier' },
        { status: 400 }
      );
    }

    // Validate SaaS price ID if provided
    if (saas && saasPriceId && saasPriceId !== VALID_PRICE_IDS.saas) {
      return NextResponse.json(
        { success: false, error: 'Invalid SaaS price ID' },
        { status: 400 }
      );
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 },
    ];

    // Determine mode based on whether SaaS add-on is included
    let mode: Stripe.Checkout.SessionCreateParams.Mode = 'payment';

    if (saas) {
      const saasPrice = saasPriceId || VALID_PRICE_IDS.saas;
      lineItems.push({ price: saasPrice, quantity: 1 });
      // When mixing one-time + recurring, use subscription mode
      mode = 'subscription';
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: lineItems,
      success_url: `${origin}/landing/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/landing/checkout-cancel.html`,
      metadata: {
        tier,
        saas: saas ? 'true' : 'false',
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      success: true,
      data: { url: session.url },
    });
  } catch (error) {
    console.error('[create-checkout-session] Error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
