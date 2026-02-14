/**
 * Tests for app/api/profiles/me/photo/route.ts
 * POST /api/profiles/me/photo
 * DELETE /api/profiles/me/photo
 */

import { NextResponse } from 'next/server';
import { POST, DELETE } from '@/app/api/profiles/me/photo/route';
import { prisma } from '@/lib/db/prisma';
import { createMockRequest, mockTrainerUser } from '@/tests/helpers/test-utils';
import * as cloudinary from '@/lib/services/cloudinary';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));
jest.mock('@/lib/services/cloudinary');

const mockedPrisma = prisma as any;
const { authenticate } = require('@/lib/middleware/auth');
const mockedCloudinary = cloudinary as jest.Mocked<typeof cloudinary>;

function mockAuthAs(user: any) {
  authenticate.mockResolvedValue({ user });
}

function mockAuthFailure() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

describe('POST /api/profiles/me/photo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const formData = new FormData();
    const request = new Request('http://localhost:3000/api/profiles/me/photo', {
      method: 'POST',
      body: formData,
    }) as any;

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 when no photo provided', async () => {
    mockAuthAs({ id: mockTrainerUser.id });

    const formData = new FormData();
    const request = new Request('http://localhost:3000/api/profiles/me/photo', {
      method: 'POST',
      body: formData,
    }) as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('No photo provided');
  });

  it('returns 400 for invalid file type', async () => {
    mockAuthAs({ id: mockTrainerUser.id });

    const formData = new FormData();
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    formData.append('photo', file);

    const request = new Request('http://localhost:3000/api/profiles/me/photo', {
      method: 'POST',
      body: formData,
    }) as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid file type');
  });

  it('returns 400 for file too large', async () => {
    mockAuthAs({ id: mockTrainerUser.id });

    const formData = new FormData();
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const file = new File([largeBuffer], 'large.jpg', { type: 'image/jpeg' });
    formData.append('photo', file);

    const request = new Request('http://localhost:3000/api/profiles/me/photo', {
      method: 'POST',
      body: formData,
    }) as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('too large');
  });

  it('successfully uploads new photo', async () => {
    mockAuthAs({ id: mockTrainerUser.id });

    const formData = new FormData();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });
    formData.append('photo', file);

    mockedPrisma.userProfile.findUnique.mockResolvedValue(null);
    mockedCloudinary.uploadImage.mockResolvedValue({
      url: 'https://cloudinary.com/photo.jpg',
      publicId: 'photo-id',
    } as any);
    mockedPrisma.userProfile.upsert.mockResolvedValue({
      userId: mockTrainerUser.id,
      profilePhotoUrl: 'https://cloudinary.com/photo.jpg',
    });
    mockedPrisma.profileCompletion.upsert.mockResolvedValue({});

    const request = new Request('http://localhost:3000/api/profiles/me/photo', {
      method: 'POST',
      body: formData,
    }) as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.profilePhotoUrl).toBe('https://cloudinary.com/photo.jpg');
  });

  it('deletes old photo when uploading new one', async () => {
    mockAuthAs({ id: mockTrainerUser.id });

    const formData = new FormData();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });
    formData.append('photo', file);

    mockedPrisma.userProfile.findUnique.mockResolvedValue({
      profilePhotoUrl: 'https://cloudinary.com/old-photo.jpg',
    });
    mockedCloudinary.getPublicIdFromUrl.mockReturnValue('old-photo-id');
    mockedCloudinary.deleteImage.mockResolvedValue(undefined as any);
    mockedCloudinary.uploadImage.mockResolvedValue({
      url: 'https://cloudinary.com/new-photo.jpg',
      publicId: 'new-photo-id',
    } as any);
    mockedPrisma.userProfile.upsert.mockResolvedValue({
      userId: mockTrainerUser.id,
      profilePhotoUrl: 'https://cloudinary.com/new-photo.jpg',
    });
    mockedPrisma.profileCompletion.upsert.mockResolvedValue({});

    const request = new Request('http://localhost:3000/api/profiles/me/photo', {
      method: 'POST',
      body: formData,
    }) as any;

    await POST(request);

    expect(mockedCloudinary.deleteImage).toHaveBeenCalledWith('old-photo-id');
  });

  it('handles upload errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockTrainerUser.id });

    const formData = new FormData();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });
    formData.append('photo', file);

    mockedPrisma.userProfile.findUnique.mockRejectedValue(new Error('DB error'));

    const request = new Request('http://localhost:3000/api/profiles/me/photo', {
      method: 'POST',
      body: formData,
    }) as any;

    const response = await POST(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});

describe('DELETE /api/profiles/me/photo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/profiles/me/photo', { method: 'DELETE' });
    const response = await DELETE(request);

    expect(response.status).toBe(401);
  });

  it('returns 404 when no profile photo exists', async () => {
    mockAuthAs({ id: mockTrainerUser.id });
    mockedPrisma.userProfile.findUnique.mockResolvedValue({ profilePhotoUrl: null });

    const request = createMockRequest('/api/profiles/me/photo', { method: 'DELETE' });
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('No profile photo to remove');
  });

  it('successfully deletes photo', async () => {
    mockAuthAs({ id: mockTrainerUser.id });
    mockedPrisma.userProfile.findUnique.mockResolvedValue({
      profilePhotoUrl: 'https://cloudinary.com/photo.jpg',
    });
    mockedCloudinary.getPublicIdFromUrl.mockReturnValue('photo-id');
    mockedCloudinary.deleteImage.mockResolvedValue(undefined as any);
    mockedPrisma.userProfile.update.mockResolvedValue({
      userId: mockTrainerUser.id,
      profilePhotoUrl: null,
    });
    mockedPrisma.profileCompletion.upsert.mockResolvedValue({});

    const request = createMockRequest('/api/profiles/me/photo', { method: 'DELETE' });
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.profilePhotoUrl).toBe(null);
    expect(mockedCloudinary.deleteImage).toHaveBeenCalledWith('photo-id');
  });

  it('updates profile completion on delete', async () => {
    mockAuthAs({ id: mockTrainerUser.id });
    mockedPrisma.userProfile.findUnique.mockResolvedValue({
      profilePhotoUrl: 'https://cloudinary.com/photo.jpg',
    });
    mockedCloudinary.getPublicIdFromUrl.mockReturnValue('photo-id');
    mockedCloudinary.deleteImage.mockResolvedValue(undefined as any);
    mockedPrisma.userProfile.update.mockResolvedValue({});
    mockedPrisma.profileCompletion.upsert.mockResolvedValue({});

    const request = createMockRequest('/api/profiles/me/photo', { method: 'DELETE' });
    await DELETE(request);

    expect(mockedPrisma.profileCompletion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { profilePhoto: false },
      })
    );
  });

  it('handles delete errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockTrainerUser.id });
    mockedPrisma.userProfile.findUnique.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/profiles/me/photo', { method: 'DELETE' });
    const response = await DELETE(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});
