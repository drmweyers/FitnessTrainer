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

  it('handles file selection via input change', () => {
    render(<PhotoUpload {...defaultProps} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 });

    fireEvent.change(input, { target: { files: [file] } });
    expect(mockOnUpload).toHaveBeenCalledWith([file]);
  });

  it('filters out non-image files', () => {
    render(<PhotoUpload {...defaultProps} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const textFile = new File(['txt'], 'doc.txt', { type: 'text/plain' });
    Object.defineProperty(textFile, 'size', { value: 1024 });

    fireEvent.change(input, { target: { files: [textFile] } });
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('filters out files exceeding 10MB', () => {
    render(<PhotoUpload {...defaultProps} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const bigFile = new File(['big'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [bigFile] } });
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('handles drop event with valid files', () => {
    render(<PhotoUpload {...defaultProps} />);
    const dropZone = screen.getByText(/Drag and drop photos here/).closest('div')!;

    const file = new File(['img'], 'dropped.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(mockOnUpload).toHaveBeenCalledWith([file]);
  });

  it('shows New badge after file selection', () => {
    render(<PhotoUpload {...defaultProps} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['img'], 'new.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('removes selected file and revokes URL', () => {
    render(<PhotoUpload {...defaultProps} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['img'], 'removable.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText('New')).toBeInTheDocument();

    // Find remove button for new photo (has bg-red-500)
    const removeButtons = Array.from(document.querySelectorAll('button[type="button"]')).filter(
      btn => btn.className.includes('bg-red-500')
    );
    expect(removeButtons.length).toBe(1);
    fireEvent.click(removeButtons[0]);

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    // onUpload called with empty array after removal
    expect(mockOnUpload).toHaveBeenLastCalledWith([]);
  });

  it('hides upload area when maxFiles reached', () => {
    render(
      <PhotoUpload
        {...defaultProps}
        maxFiles={1}
        existingPhotos={['/p1.jpg']}
        onRemove={mockOnRemove}
      />
    );
    expect(screen.queryByText(/Drag and drop/)).not.toBeInTheDocument();
  });

  it('limits added files to remaining slots', () => {
    render(
      <PhotoUpload
        {...defaultProps}
        maxFiles={2}
        existingPhotos={['/p1.jpg']}
        onRemove={mockOnRemove}
      />
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file1 = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
    const file2 = new File(['b'], 'b.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file1, 'size', { value: 1024 });
    Object.defineProperty(file2, 'size', { value: 1024 });

    fireEvent.change(input, { target: { files: [file1, file2] } });
    // Only 1 slot remaining, so only file1 should be added
    expect(mockOnUpload).toHaveBeenCalledWith([file1]);
  });

  it('handles null files gracefully', () => {
    render(<PhotoUpload {...defaultProps} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: null } });
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('calls onRemove when existing photo remove button clicked', () => {
    render(
      <PhotoUpload
        {...defaultProps}
        existingPhotos={['/photo1.jpg']}
        onRemove={mockOnRemove}
      />
    );
    const removeButtons = Array.from(document.querySelectorAll('button[type="button"]')).filter(
      btn => btn.className.includes('bg-red-500')
    );
    expect(removeButtons.length).toBe(1);
    fireEvent.click(removeButtons[0]);
    expect(mockOnRemove).toHaveBeenCalledWith('/photo1.jpg');
  });

  it('clicks browse to trigger file input', () => {
    render(<PhotoUpload {...defaultProps} />);
    const browseBtn = screen.getByText('browse');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click');
    fireEvent.click(browseBtn);
    expect(clickSpy).toHaveBeenCalled();
  });
});
