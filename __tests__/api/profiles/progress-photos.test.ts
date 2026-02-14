/**
 * Tests for app/api/profiles/progress-photos/route.ts
 * GET /api/profiles/progress-photos
 * POST /api/profiles/progress-photos
 * DELETE /api/profiles/progress-photos
 */

import { NextResponse } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/profiles/progress-photos/route';
import { prisma } from '@/lib/db/prisma';
import { createMockRequest, mockClientUser } from '@/tests/helpers/test-utils';
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

describe('GET /api/profiles/progress-photos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/profiles/progress-photos');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('successfully fetches progress photos', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const mockPhotos = [
      {
        id: 'photo-1',
        userId: mockClientUser.id,
        photoUrl: 'https://cloudinary.com/photo1.jpg',
        thumbnailUrl: 'https://cloudinary.com/thumb1.jpg',
        photoType: 'front',
        notes: 'Starting photo',
        takenAt: new Date('2024-01-01'),
        uploadedAt: new Date('2024-01-01'),
      },
      {
        id: 'photo-2',
        userId: mockClientUser.id,
        photoUrl: 'https://cloudinary.com/photo2.jpg',
        thumbnailUrl: 'https://cloudinary.com/thumb2.jpg',
        photoType: 'side',
        notes: null,
        takenAt: null,
        uploadedAt: new Date('2024-01-02'),
      },
    ];

    mockedPrisma.progressPhoto.findMany.mockResolvedValue(mockPhotos);

    const request = createMockRequest('/api/profiles/progress-photos');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].photoType).toBe('front');
  });

  it('returns empty array when no photos', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.progressPhoto.findMany.mockResolvedValue([]);

    const request = createMockRequest('/api/profiles/progress-photos');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('orders photos by uploadedAt desc', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const request = createMockRequest('/api/profiles/progress-photos');
    await GET(request);

    expect(mockedPrisma.progressPhoto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { uploadedAt: 'desc' },
      })
    );
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.progressPhoto.findMany.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/profiles/progress-photos');
    const response = await GET(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});

describe('POST /api/profiles/progress-photos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const formData = new FormData();
    const request = new Request('http://localhost:3000/api/profiles/progress-photos', {
      method: 'POST',
      body: formData,
    }) as any;

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 when no photo provided', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const formData = new FormData();
    const request = new Request('http://localhost:3000/api/profiles/progress-photos', {
      method: 'POST',
      body: formData,
    }) as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('No photo provided');
  });

  it('returns 400 for invalid file type', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const formData = new FormData();
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    formData.append('photo', file);

    const request = new Request('http://localhost:3000/api/profiles/progress-photos', {
      method: 'POST',
      body: formData,
    }) as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid file type');
  });

  it('returns 400 for file too large', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const formData = new FormData();
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const file = new File([largeBuffer], 'large.jpg', { type: 'image/jpeg' });
    formData.append('photo', file);

    const request = new Request('http://localhost:3000/api/profiles/progress-photos', {
      method: 'POST',
      body: formData,
    }) as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('too large');
  });

  it('returns 400 for invalid photo type', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const formData = new FormData();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });
    formData.append('photo', file);
    formData.append('photoType', 'invalid');

    const request = new Request('http://localhost:3000/api/profiles/progress-photos', {
      method: 'POST',
      body: formData,
    }) as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid photo type');
  });

  it('successfully uploads progress photo', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const formData = new FormData();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });
    formData.append('photo', file);
    formData.append('photoType', 'front');
    formData.append('notes', 'Starting photo');
    formData.append('takenAt', '2024-01-01');

    mockedCloudinary.uploadImage.mockResolvedValueOnce({
      url: 'https://cloudinary.com/photo.jpg',
      publicId: 'photo-id',
    } as any);
    mockedCloudinary.uploadImage.mockResolvedValueOnce({
      url: 'https://cloudinary.com/thumb.jpg',
      publicId: 'thumb-id',
    } as any);
    mockedPrisma.progressPhoto.create.mockResolvedValue({
      id: 'photo-1',
      userId: mockClientUser.id,
      photoUrl: 'https://cloudinary.com/photo.jpg',
      thumbnailUrl: 'https://cloudinary.com/thumb.jpg',
      photoType: 'front',
      notes: 'Starting photo',
      takenAt: new Date('2024-01-01'),
    });

    const request = new Request('http://localhost:3000/api/profiles/progress-photos', {
      method: 'POST',
      body: formData,
    }) as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.photoType).toBe('front');
    expect(body.data.photoUrl).toBe('https://cloudinary.com/photo.jpg');
    expect(mockedCloudinary.uploadImage).toHaveBeenCalledTimes(2);
  });

  it('defaults photoType to other', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const formData = new FormData();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });
    formData.append('photo', file);

    mockedCloudinary.uploadImage.mockResolvedValue({
      url: 'https://cloudinary.com/photo.jpg',
      publicId: 'photo-id',
    } as any);
    mockedPrisma.progressPhoto.create.mockResolvedValue({
      id: 'photo-1',
      userId: mockClientUser.id,
      photoType: 'other',
    } as any);

    const request = new Request('http://localhost:3000/api/profiles/progress-photos', {
      method: 'POST',
      body: formData,
    }) as any;

    await POST(request);

    expect(mockedPrisma.progressPhoto.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          photoType: 'other',
        }),
      })
    );
  });

  it('handles upload errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockClientUser.id });

    const formData = new FormData();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });
    formData.append('photo', file);

    mockedCloudinary.uploadImage.mockRejectedValue(new Error('Upload failed'));

    const request = new Request('http://localhost:3000/api/profiles/progress-photos', {
      method: 'POST',
      body: formData,
    }) as any;

    const response = await POST(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});

describe('DELETE /api/profiles/progress-photos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/profiles/progress-photos?id=photo-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 when photo ID missing', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const request = createMockRequest('/api/profiles/progress-photos', {
      method: 'DELETE',
    });
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Photo ID required');
  });

  it('returns 404 when photo not found', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.progressPhoto.findFirst.mockResolvedValue(null);

    const request = createMockRequest('/api/profiles/progress-photos?id=photo-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Photo not found');
  });

  it('successfully deletes progress photo', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.progressPhoto.findFirst.mockResolvedValue({
      id: 'photo-1',
      userId: mockClientUser.id,
      photoUrl: 'https://cloudinary.com/photo.jpg',
      thumbnailUrl: 'https://cloudinary.com/thumb.jpg',
    });
    mockedCloudinary.getPublicIdFromUrl.mockReturnValue('photo-id');
    mockedCloudinary.deleteImage.mockResolvedValue(undefined as any);
    mockedPrisma.progressPhoto.delete.mockResolvedValue({});

    const request = createMockRequest('/api/profiles/progress-photos?id=photo-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockedCloudinary.deleteImage).toHaveBeenCalledTimes(2);
  });

  it('verifies user owns the photo', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const request = createMockRequest('/api/profiles/progress-photos?id=photo-1', {
      method: 'DELETE',
    });
    await DELETE(request);

    expect(mockedPrisma.progressPhoto.findFirst).toHaveBeenCalledWith({
      where: { id: 'photo-1', userId: mockClientUser.id },
    });
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.progressPhoto.findFirst.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/profiles/progress-photos?id=photo-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});
