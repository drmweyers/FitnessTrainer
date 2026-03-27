/**
 * Tests for POST /api/create-checkout-session
 */

import { NextRequest } from 'next/server';

// Use global to share between jest.mock factory and test code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _mockRef: { create: jest.Mock } = { create: jest.fn() };

jest.mock('stripe', () => {
  return function MockStripe() {
    return {
      checkout: {
        sessions: {
          get create() {
            // Dynamically resolve so tests can reconfigure
            return _mockRef.create;
          },
        },
      },
    };
  };
});

// Import after mock is set up
import { POST } from '@/app/api/create-checkout-session/route';

function makeRequest(body: Record<string, unknown>, origin = 'http://localhost:3000') {
  return new NextRequest('http://localhost:3000/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      origin,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/create-checkout-session', () => {
  beforeEach(() => {
    _mockRef.create.mockReset();
  });

  it('creates a payment session for a one-time tier', async () => {
    _mockRef.create.mockResolvedValue({
      url: 'https://checkout.stripe.com/test-session',
    });

    const req = makeRequest({
      priceId: 'price_1TEwpaGo4HHYDfDVyvecwfMc',
      tier: 'starter',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.url).toBe('https://checkout.stripe.com/test-session');

    expect(_mockRef.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [{ price: 'price_1TEwpaGo4HHYDfDVyvecwfMc', quantity: 1 }],
        metadata: { tier: 'starter', saas: 'false' },
      })
    );
  });

  it('creates a subscription session when SaaS add-on is included', async () => {
    _mockRef.create.mockResolvedValue({
      url: 'https://checkout.stripe.com/test-sub-session',
    });

    const req = makeRequest({
      priceId: 'price_1TEwpcGo4HHYDfDVqNAFCnDt',
      tier: 'professional',
      saas: true,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    expect(_mockRef.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [
          { price: 'price_1TEwpcGo4HHYDfDVqNAFCnDt', quantity: 1 },
          { price: 'price_1TEwpdGo4HHYDfDVmtIVLSQo', quantity: 1 },
        ],
        metadata: { tier: 'professional', saas: 'true' },
      })
    );
  });

  it('returns 400 for missing required fields', async () => {
    const req = makeRequest({ tier: 'starter' });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Missing required fields');
  });

  it('returns 400 for invalid tier', async () => {
    const req = makeRequest({
      priceId: 'price_1TEwpaGo4HHYDfDVyvecwfMc',
      tier: 'gold',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Invalid tier');
  });

  it('returns 400 when priceId does not match tier', async () => {
    const req = makeRequest({
      priceId: 'price_1TEwpcGo4HHYDfDVqNAFCnDt',
      tier: 'starter',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain('does not match');
  });

  it('returns 500 when Stripe fails', async () => {
    _mockRef.create.mockRejectedValue(new Error('Stripe API error'));

    const req = makeRequest({
      priceId: 'price_1TEwpaGo4HHYDfDVyvecwfMc',
      tier: 'starter',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Failed to create checkout session');
  });

  it('sets correct success and cancel URLs from origin header', async () => {
    _mockRef.create.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });

    const req = makeRequest(
      { priceId: 'price_1TEwpeGo4HHYDfDVe7M1XZTD', tier: 'enterprise' },
      'https://evofitmeals.com'
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(_mockRef.create).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: 'https://evofitmeals.com/landing/checkout-success.html?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://evofitmeals.com/landing/checkout-cancel.html',
      })
    );
  });
});
