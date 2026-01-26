import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('TEST LOGIN: Starting...');

    const body = await request.json();
    console.log('TEST LOGIN: Body parsed:', { email: body.email });

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });

    console.log('TEST LOGIN: User found:', user ? 'YES' : 'NO');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 401 }
      );
    }

    console.log('TEST LOGIN: Comparing password...');
    const isPasswordValid = await bcrypt.compare(body.password, user.passwordHash);
    console.log('TEST LOGIN: Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }

    console.log('TEST LOGIN: Login successful!');

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    console.error('TEST LOGIN: Error:', error);
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
