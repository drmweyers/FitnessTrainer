import { v2 as cloudinary } from 'cloudinary';
import {
  uploadImage,
  deleteImage,
  getPublicIdFromUrl,
} from '@/lib/services/cloudinary';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

const mockCloudinary = cloudinary as jest.Mocked<typeof cloudinary>;

describe('Cloudinary Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      const mockResult = {
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'profile-photos/user123',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 12345,
      };

      // Mock upload_stream to call callback with success
      (mockCloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          // Simulate successful upload
          callback(null, mockResult);
          return { end: jest.fn() };
        }
      );

      const result = await uploadImage(mockBuffer, 'profile-photos');

      expect(result).toEqual({
        url: 'https://cloudinary.com/image.jpg',
        publicId: 'profile-photos/user123',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 12345,
      });
      expect(mockCloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        {
          folder: 'profile-photos',
          resource_type: 'image',
        },
        expect.any(Function)
      );
    });

    it('should upload with transformation options', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      const mockResult = {
        secure_url: 'https://cloudinary.com/image-transformed.jpg',
        public_id: 'photos/user456',
        width: 400,
        height: 400,
        format: 'jpg',
        bytes: 5000,
      };

      (mockCloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockResult);
          return { end: jest.fn() };
        }
      );

      const options = {
        transformation: { width: 400, height: 400, crop: 'fill' },
      };

      await uploadImage(mockBuffer, 'photos', options);

      expect(mockCloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        {
          folder: 'photos',
          resource_type: 'image',
          transformation: { width: 400, height: 400, crop: 'fill' },
        },
        expect.any(Function)
      );
    });

    it('should reject when upload fails with error', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      const mockError = new Error('Network error');

      (mockCloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(mockError, null);
          return { end: jest.fn() };
        }
      );

      await expect(uploadImage(mockBuffer, 'photos')).rejects.toThrow(
        'Cloudinary upload failed: Network error'
      );
    });

    it('should reject when result is null/undefined', async () => {
      const mockBuffer = Buffer.from('fake-image-data');

      (mockCloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, null);
          return { end: jest.fn() };
        }
      );

      await expect(uploadImage(mockBuffer, 'photos')).rejects.toThrow(
        'Cloudinary upload returned no result'
      );
    });

    it('should call uploadStream.end with buffer', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      const mockEnd = jest.fn();
      const mockResult = {
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'photos/user789',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 10000,
      };

      (mockCloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, mockResult);
          return { end: mockEnd };
        }
      );

      await uploadImage(mockBuffer, 'photos');

      expect(mockEnd).toHaveBeenCalledWith(mockBuffer);
    });
  });

  describe('deleteImage', () => {
    it('should delete image by public ID', async () => {
      (mockCloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      await deleteImage('photos/user123');

      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(
        'photos/user123'
      );
    });

    it('should handle deletion errors', async () => {
      (mockCloudinary.uploader.destroy as jest.Mock).mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(deleteImage('photos/user456')).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  describe('getPublicIdFromUrl', () => {
    it('should extract public ID from standard Cloudinary URL', () => {
      const url =
        'https://res.cloudinary.com/demo/image/upload/profile-photos/user123.jpg';
      const publicId = getPublicIdFromUrl(url);

      expect(publicId).toBe('profile-photos/user123');
    });

    it('should extract public ID from versioned URL', () => {
      const url =
        'https://res.cloudinary.com/demo/image/upload/v1234567890/profile-photos/user456.jpg';
      const publicId = getPublicIdFromUrl(url);

      expect(publicId).toBe('profile-photos/user456');
    });

    it('should extract public ID with nested folders', () => {
      const url =
        'https://res.cloudinary.com/demo/image/upload/v1/photos/profiles/user789.png';
      const publicId = getPublicIdFromUrl(url);

      expect(publicId).toBe('photos/profiles/user789');
    });

    it('should extract public ID without version', () => {
      const url =
        'https://res.cloudinary.com/demo/image/upload/simple-folder/image.jpg';
      const publicId = getPublicIdFromUrl(url);

      expect(publicId).toBe('simple-folder/image');
    });

    it('should return null for invalid URL format', () => {
      const url = 'https://example.com/image.jpg';
      const publicId = getPublicIdFromUrl(url);

      expect(publicId).toBeNull();
    });

    it('should return null for malformed Cloudinary URL', () => {
      const url = 'https://res.cloudinary.com/demo/malformed';
      const publicId = getPublicIdFromUrl(url);

      expect(publicId).toBeNull();
    });

    it('should return null when URL parsing throws', () => {
      const invalidUrl = null as any;
      const publicId = getPublicIdFromUrl(invalidUrl);

      expect(publicId).toBeNull();
    });

    it('should handle URLs with different file extensions', () => {
      const urls = [
        'https://res.cloudinary.com/demo/image/upload/folder/image.jpg',
        'https://res.cloudinary.com/demo/image/upload/folder/image.png',
        'https://res.cloudinary.com/demo/image/upload/folder/image.webp',
        'https://res.cloudinary.com/demo/image/upload/folder/image.gif',
      ];

      urls.forEach((url) => {
        const publicId = getPublicIdFromUrl(url);
        expect(publicId).toBe('folder/image');
      });
    });
  });
});
