// Mock cloudinary before import
const mockUploadStream = jest.fn();
const mockDestroy = jest.fn();

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: (...args: any[]) => mockUploadStream(...args),
      destroy: (...args: any[]) => mockDestroy(...args),
    },
  },
}));

import { uploadImage, deleteImage, getPublicIdFromUrl } from '@/lib/services/cloudinary';

describe('Cloudinary Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const mockBuffer = Buffer.from('test-image-data');
      const mockResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/folder/image.jpg',
        public_id: 'folder/image',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 12345,
      };

      // Mock upload_stream to return a stream that calls callback with result
      mockUploadStream.mockImplementation((options, callback) => {
        // Simulate successful upload
        setTimeout(() => callback(null, mockResult), 0);
        return {
          end: jest.fn(),
        };
      });

      const result = await uploadImage(mockBuffer, 'test-folder');

      expect(result).toEqual({
        url: 'https://res.cloudinary.com/test/image/upload/v123/folder/image.jpg',
        publicId: 'folder/image',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 12345,
      });

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'test-folder',
          resource_type: 'image',
        }),
        expect.any(Function)
      );
    });

    it('should upload image with transformation options', async () => {
      const mockBuffer = Buffer.from('test-image-data');
      const mockResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/folder/thumb.jpg',
        public_id: 'folder/thumb',
        width: 200,
        height: 200,
        format: 'jpg',
        bytes: 5000,
      };

      mockUploadStream.mockImplementation((options, callback) => {
        setTimeout(() => callback(null, mockResult), 0);
        return {
          end: jest.fn(),
        };
      });

      const transformOptions = { transformation: { width: 200, height: 200, crop: 'fill' } };
      await uploadImage(mockBuffer, 'thumbnails', transformOptions);

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'thumbnails',
          resource_type: 'image',
          transformation: { width: 200, height: 200, crop: 'fill' },
        }),
        expect.any(Function)
      );
    });

    it('should handle upload error from Cloudinary', async () => {
      const mockBuffer = Buffer.from('test-image-data');
      const mockError = { message: 'Invalid API credentials' };

      mockUploadStream.mockImplementation((options, callback) => {
        setTimeout(() => callback(mockError, null), 0);
        return {
          end: jest.fn(),
        };
      });

      await expect(uploadImage(mockBuffer, 'test-folder')).rejects.toThrow(
        'Cloudinary upload failed: Invalid API credentials'
      );
    });

    it('should handle null result from Cloudinary', async () => {
      const mockBuffer = Buffer.from('test-image-data');

      mockUploadStream.mockImplementation((options, callback) => {
        setTimeout(() => callback(null, null), 0);
        return {
          end: jest.fn(),
        };
      });

      await expect(uploadImage(mockBuffer, 'test-folder')).rejects.toThrow(
        'Cloudinary upload returned no result'
      );
    });

    it('should call stream.end with buffer', async () => {
      const mockBuffer = Buffer.from('test-image-data');
      const mockResult = {
        secure_url: 'https://res.cloudinary.com/test/image.jpg',
        public_id: 'image',
        width: 100,
        height: 100,
        format: 'jpg',
        bytes: 1000,
      };

      const mockEnd = jest.fn();
      mockUploadStream.mockImplementation((options, callback) => {
        setTimeout(() => callback(null, mockResult), 0);
        return {
          end: mockEnd,
        };
      });

      await uploadImage(mockBuffer, 'folder');

      expect(mockEnd).toHaveBeenCalledWith(mockBuffer);
    });
  });

  describe('deleteImage', () => {
    it('should delete image by public ID', async () => {
      mockDestroy.mockResolvedValue({ result: 'ok' });

      await deleteImage('folder/image-123');

      expect(mockDestroy).toHaveBeenCalledWith('folder/image-123');
    });

    it('should handle deletion errors gracefully', async () => {
      mockDestroy.mockRejectedValue(new Error('Image not found'));

      await expect(deleteImage('non-existent')).rejects.toThrow('Image not found');
    });
  });

  describe('getPublicIdFromUrl', () => {
    it('should extract public ID from standard Cloudinary URL', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg';
      const publicId = getPublicIdFromUrl(url);

      expect(publicId).toBe('sample');
    });

    it('should extract public ID from URL with folder', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v1234567890/folder/subfolder/image.png';
      const publicId = getPublicIdFromUrl(url);

      expect(publicId).toBe('folder/subfolder/image');
    });

    it('should extract public ID from URL without version', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      const publicId = getPublicIdFromUrl(url);

      expect(publicId).toBe('sample');
    });

    it('should return null for invalid URL format', () => {
      const url = 'https://example.com/random-image.jpg';
      const publicId = getPublicIdFromUrl(url);

      expect(publicId).toBeNull();
    });

    it('should return null for malformed Cloudinary URL', () => {
      const url = 'https://res.cloudinary.com/demo/invalid-path';
      const publicId = getPublicIdFromUrl(url);

      expect(publicId).toBeNull();
    });

    it('should handle exception and return null', () => {
      // Pass something that will cause match to fail
      const publicId = getPublicIdFromUrl('');

      expect(publicId).toBeNull();
    });
  });
});
