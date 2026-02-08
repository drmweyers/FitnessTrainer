/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import PhotoUpload from '../PhotoUpload';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = jest.fn();

describe('PhotoUpload', () => {
  const mockOnUpload = jest.fn();
  const mockOnRemove = jest.fn();

  const defaultProps = {
    onUpload: mockOnUpload,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the upload area', () => {
    render(<PhotoUpload {...defaultProps} />);
    expect(screen.getByText(/Drag and drop photos here/)).toBeInTheDocument();
  });

  it('renders browse button', () => {
    render(<PhotoUpload {...defaultProps} />);
    expect(screen.getByText('browse')).toBeInTheDocument();
  });

  it('shows photo count limit', () => {
    render(<PhotoUpload {...defaultProps} />);
    expect(screen.getByText(/0\/4 photos/)).toBeInTheDocument();
  });

  it('shows custom max files limit', () => {
    render(<PhotoUpload {...defaultProps} maxFiles={6} />);
    expect(screen.getByText(/0\/6 photos/)).toBeInTheDocument();
  });

  it('renders photo guidelines', () => {
    render(<PhotoUpload {...defaultProps} />);
    expect(screen.getByText('Photo Guidelines')).toBeInTheDocument();
    expect(screen.getByText(/Take photos in consistent lighting/)).toBeInTheDocument();
    expect(screen.getByText(/Use the same poses/)).toBeInTheDocument();
    expect(screen.getByText(/Wear similar clothing/)).toBeInTheDocument();
    expect(screen.getByText(/Take photos at the same time/)).toBeInTheDocument();
  });

  it('renders file size info', () => {
    render(<PhotoUpload {...defaultProps} />);
    expect(screen.getByText(/PNG, JPG up to 10MB/)).toBeInTheDocument();
  });

  it('renders existing photos when provided', () => {
    render(
      <PhotoUpload
        {...defaultProps}
        existingPhotos={['/photo1.jpg', '/photo2.jpg']}
        onRemove={mockOnRemove}
      />
    );
    const existingLabels = screen.getAllByText('Existing');
    expect(existingLabels.length).toBe(2);
  });

  it('shows existing photo count in limit', () => {
    render(
      <PhotoUpload
        {...defaultProps}
        existingPhotos={['/photo1.jpg']}
        onRemove={mockOnRemove}
      />
    );
    expect(screen.getByText(/1\/4 photos/)).toBeInTheDocument();
  });

  it('handles drag over', () => {
    render(<PhotoUpload {...defaultProps} />);
    const dropZone = screen.getByText(/Drag and drop photos here/).closest('div')!;
    fireEvent.dragOver(dropZone);
    expect(dropZone.className).toContain('border-blue-500');
  });

  it('handles drag leave', () => {
    render(<PhotoUpload {...defaultProps} />);
    const dropZone = screen.getByText(/Drag and drop photos here/).closest('div')!;
    fireEvent.dragOver(dropZone);
    fireEvent.dragLeave(dropZone);
    expect(dropZone.className).not.toContain('border-blue-500');
  });

  it('has hidden file input', () => {
    render(<PhotoUpload {...defaultProps} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input?.className).toContain('hidden');
  });

  it('accepts image files', () => {
    render(<PhotoUpload {...defaultProps} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('accept', 'image/*');
  });

  it('allows multiple file selection', () => {
    render(<PhotoUpload {...defaultProps} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('multiple');
  });
});
