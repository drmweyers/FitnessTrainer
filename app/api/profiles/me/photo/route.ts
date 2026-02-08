import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { uploadImage, deleteImage, getPublicIdFromUrl } from '@/lib/services/cloudinary';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;
  const userId = req.user!.id;

  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No photo provided' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Delete old photo if exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { profilePhotoUrl: true },
    });

    if (existingProfile?.profilePhotoUrl) {
      const oldPublicId = getPublicIdFromUrl(existingProfile.profilePhotoUrl);
      if (oldPublicId) {
        await deleteImage(oldPublicId).catch(() => {});
      }
    }

    // Upload new photo
    const result = await uploadImage(buffer, 'evofit/avatars', {
      transformation: { width: 400, height: 400, crop: 'fill', gravity: 'face' },
    });

    // Update profile
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: { userId, profilePhotoUrl: result.url },
      update: { profilePhotoUrl: result.url },
    });

    // Update profile completion
    await prisma.profileCompletion.upsert({
      where: { userId },
      create: { userId, profilePhoto: true },
      update: { profilePhoto: true },
    });

    return NextResponse.json({
      success: true,
      data: { profilePhotoUrl: profile.profilePhotoUrl },
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;
  const userId = req.user!.id;

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { profilePhotoUrl: true },
    });

    if (!profile?.profilePhotoUrl) {
      return NextResponse.json(
        { success: false, error: 'No profile photo to remove' },
        { status: 404 }
      );
    }

    // Delete from Cloudinary
    const publicId = getPublicIdFromUrl(profile.profilePhotoUrl);
    if (publicId) {
      await deleteImage(publicId).catch(() => {});
    }

    // Update profile
    await prisma.userProfile.update({
      where: { userId },
      data: { profilePhotoUrl: null },
    });

    // Update profile completion
    await prisma.profileCompletion.upsert({
      where: { userId },
      create: { userId, profilePhoto: false },
      update: { profilePhoto: false },
    });

    return NextResponse.json({ success: true, data: { profilePhotoUrl: null } });
  } catch (error) {
    console.error('Photo delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
