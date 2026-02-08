import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { uploadImage, deleteImage, getPublicIdFromUrl } from '@/lib/services/cloudinary';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VALID_PHOTO_TYPES = ['front', 'side', 'back', 'other'];

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;
  const userId = req.user!.id;

  try {
    const photos = await prisma.progressPhoto.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: photos });
  } catch (error) {
    console.error('Progress photos fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress photos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;
  const userId = req.user!.id;

  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    const photoType = (formData.get('photoType') as string) || 'other';
    const notes = formData.get('notes') as string | null;
    const takenAt = formData.get('takenAt') as string | null;

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
        { success: false, error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    if (!VALID_PHOTO_TYPES.includes(photoType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid photo type. Use: front, side, back, other' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload full-size photo
    const result = await uploadImage(buffer, 'evofit/progress');

    // Upload thumbnail
    const thumbnail = await uploadImage(buffer, 'evofit/progress/thumbnails', {
      transformation: { width: 200, height: 200, crop: 'fill' },
    });

    const photo = await prisma.progressPhoto.create({
      data: {
        userId,
        photoUrl: result.url,
        thumbnailUrl: thumbnail.url,
        photoType: photoType as 'front' | 'side' | 'back' | 'other',
        notes: notes || null,
        takenAt: takenAt ? new Date(takenAt) : null,
      },
    });

    return NextResponse.json({ success: true, data: photo }, { status: 201 });
  } catch (error) {
    console.error('Progress photo upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload progress photo' },
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
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('id');

    if (!photoId) {
      return NextResponse.json(
        { success: false, error: 'Photo ID required' },
        { status: 400 }
      );
    }

    const photo = await prisma.progressPhoto.findFirst({
      where: { id: photoId, userId },
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Delete from Cloudinary
    const publicId = getPublicIdFromUrl(photo.photoUrl);
    if (publicId) {
      await deleteImage(publicId).catch(() => {});
    }
    if (photo.thumbnailUrl) {
      const thumbId = getPublicIdFromUrl(photo.thumbnailUrl);
      if (thumbId) {
        await deleteImage(thumbId).catch(() => {});
      }
    }

    await prisma.progressPhoto.delete({ where: { id: photoId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Progress photo delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete progress photo' },
      { status: 500 }
    );
  }
}
