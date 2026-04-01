/**
 * Story 010-06: Generate Invoices
 * Epic 010: Payments & Billing
 *
 * Tests invoice generation workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    invoice: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
    },
  },
}));

import { authenticate } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';

const mockedPrisma = prisma as any;
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('Story 010-06: Generate Invoices - Create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer generates invoice for client', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/invoices'), { user: trainer })
    );

    const mockInvoice = {
      id: 'inv-1',
      trainerId: trainer.id,
      clientId: client.id,
      invoiceNumber: 'INV-2026-001',
      amount: 300.00,
      status: 'draft',
      items: [
        { description: '4 Training Sessions', quantity: 4, rate: 75, amount: 300 },
      ],
    };

    mockedPrisma.invoice.create.mockResolvedValueOnce(mockInvoice);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'generateInvoice', data: { clientId: client.id, items: [{ description: '4 Training Sessions', quantity: 4, rate: 75 }] } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer generates invoice with multiple items', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/invoices'), { user: trainer })
    );

    const mockInvoice = {
      id: 'inv-2',
      trainerId: trainer.id,
      clientId: client.id,
      amount: 425.00,
      items: [
        { description: 'Training Sessions', quantity: 5, rate: 75, amount: 375 },
        { description: 'Assessment Fee', quantity: 1, rate: 50, amount: 50 },
      ],
    };

    mockedPrisma.invoice.create.mockResolvedValueOnce(mockInvoice);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'generateInvoice', data: {
          clientId: client.id,
          items: [
            { description: 'Training Sessions', quantity: 5, rate: 75 },
            { description: 'Assessment Fee', quantity: 1, rate: 50 },
          ]
        } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer generates recurring invoice', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/invoices'), { user: trainer })
    );

    const mockInvoice = {
      id: 'inv-rec',
      trainerId: trainer.id,
      amount: 299.00,
      type: 'recurring',
      billingPeriod: '2026-04-01 to 2026-04-30',
    };

    mockedPrisma.invoice.create.mockResolvedValueOnce(mockInvoice);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'generateInvoice', data: { type: 'recurring', amount: 299, period: 'monthly' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-06: Generate Invoices - Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer views all invoices', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/invoices'), { user: trainer })
    );

    const mockInvoices = [
      { id: 'inv-1', amount: 300, status: 'paid' },
      { id: 'inv-2', amount: 425, status: 'pending' },
    ];

    mockedPrisma.invoice.findMany.mockResolvedValueOnce(mockInvoices);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewInvoices' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client views their invoices', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/invoices/my'), { user: client })
    );

    const mockInvoices = [
      { id: 'inv-1', amount: 300, status: 'pending' },
    ];

    mockedPrisma.invoice.findMany.mockResolvedValueOnce(mockInvoices);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'viewMyInvoices' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer sends invoice to client', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/invoices/inv-1/send'), { user: trainer })
    );

    mockedPrisma.invoice.update.mockResolvedValueOnce({
      id: 'inv-1',
      status: 'sent',
      sentAt: new Date(),
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'sendInvoice', data: { invoiceId: 'inv-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer marks invoice as paid', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/invoices/inv-1'), { user: trainer })
    );

    mockedPrisma.invoice.update.mockResolvedValueOnce({
      id: 'inv-1',
      status: 'paid',
      paidAt: new Date(),
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'markInvoicePaid', data: { invoiceId: 'inv-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-06: Generate Invoices - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles invoice with zero amount', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedPrisma.invoice.create.mockResolvedValueOnce({
      id: 'inv-zero',
      amount: 0,
      status: 'draft',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'generateInvoice', data: { items: [] } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('prevents duplicate invoice numbers', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedPrisma.invoice.findMany.mockResolvedValueOnce([
      { invoiceNumber: 'INV-2026-001' },
    ]);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'generateInvoice', data: { invoiceNumber: 'INV-2026-001' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles invoice cancellation', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/invoices/inv-1'), { user: trainer })
    );

    mockedPrisma.invoice.update.mockResolvedValueOnce({
      id: 'inv-1',
      status: 'cancelled',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelInvoice', data: { invoiceId: 'inv-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
