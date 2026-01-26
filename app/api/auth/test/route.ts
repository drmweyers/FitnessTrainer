import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('TEST: Creating user...');
    const passwordHash = await bcrypt.hash('Test12345!', 10);
    console.log('TEST: Password hashed');

    const user = await prisma.user.create({
      data: {
        email: 'testuser@test.com',
        passwordHash,
        role: 'client',
        isActive: true,
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    console.log('TEST: User created:', user.email);

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    console.error('TEST: Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
      },
      { status: 500 }
    );
  }
}
