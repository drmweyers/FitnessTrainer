import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COMING_SOON = {
  success: false,
  error: 'Progress photos are coming soon. This feature is not yet available.',
};

export async function GET() {
  return NextResponse.json(COMING_SOON, { status: 501 });
}

export async function POST() {
  return NextResponse.json(COMING_SOON, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json(COMING_SOON, { status: 501 });
}
