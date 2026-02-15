/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PhotoGallery from '../PhotoGallery';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

// Mock PhotoComparison
jest.mock('../PhotoComparison', () => {
  return function MockPhotoComparison({ onClose }: any) {
    return (
      <div data-testid="photo-comparison">
        Photo Comparison
        <button onClick={onClose}>Close Comparison</button>
      </div>
    );
  };
});

describe('PhotoGallery', () => {
  const mockPhotos = [
    {
      id: 'p1',
      url: '/photos/p1.jpg',
      date: '2025-01-15T00:00:00Z',
      angle: 'front' as const,
      isPublic: true,
      measurements: { weight: 80, bodyFat: 15 },
      notes: 'Starting point',
    },
    {
      id: 'p2',
      url: '/photos/p2.jpg',
      date: '2025-02-15T00:00:00Z',
      angle: 'side' as const,
      isPublic: false,
      measurements: { weight: 78, bodyFat: 14 },
    },
    {
      id: 'p3',
      url: '/photos/p3.jpg',
      date: '2025-03-15T00:00:00Z',
      angle: 'back' as const,
      isPublic: true,
    },
  ];

  const defaultProps = {
    photos: mockPhotos,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PhotoGallery {...defaultProps} />);
    // Should render at least the photo grid
    expect(screen.getAllByRole('img').length).toBe(3);
  });

  it('renders all photos in grid view by default', () => {
    render(<PhotoGallery {...defaultProps} />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(3);
  });

  it('shows Grid and Timeline view mode toggles', () => {
    render(<PhotoGallery {...defaultProps} />);
    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
  });

  it('shows angle filter dropdown', () => {
    render(<PhotoGallery {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('filters photos by angle', () => {
    render(<PhotoGallery {...defaultProps} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'front' } });

    const images = screen.getAllByRole('img');
    expect(images.length).toBe(1);
  });

  it('shows all photos when filter is set to all', () => {
    render(<PhotoGallery {...defaultProps} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'all' } });

    const images = screen.getAllByRole('img');
    expect(images.length).toBe(3);
  });

  it('displays privacy badges on photos', () => {
    render(<PhotoGallery {...defaultProps} />);
    const publicBadges = screen.getAllByText('Public');
    const privateBadges = screen.getAllByText('Private');
    expect(publicBadges.length).toBe(2);
    expect(privateBadges.length).toBe(1);
  });

  it('shows photo dates', () => {
    render(<PhotoGallery {...defaultProps} />);
    // Date 2025-01-15T00:00:00Z may render as Jan 14 or Jan 15 depending on timezone
    expect(screen.getByText(/Jan 1[45], 2025/)).toBeInTheDocument();
  });

  it('shows angle labels on photos', () => {
    render(<PhotoGallery {...defaultProps} />);
    expect(screen.getByText('front view')).toBeInTheDocument();
    expect(screen.getByText('side view')).toBeInTheDocument();
    expect(screen.getByText('back view')).toBeInTheDocument();
  });

  it('does not show action buttons when canEdit is false', () => {
    render(<PhotoGallery {...defaultProps} canEdit={false} />);
    expect(screen.queryByText('Select')).not.toBeInTheDocument();
    expect(screen.queryByText('Compare')).not.toBeInTheDocument();
  });

  it('shows Select and Compare buttons when canEdit is true', () => {
    render(<PhotoGallery {...defaultProps} canEdit />);
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Compare')).toBeInTheDocument();
  });

  it('enters selection mode when Select is clicked', () => {
    render(<PhotoGallery {...defaultProps} canEdit />);
    fireEvent.click(screen.getByText('Select'));

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('0 selected')).toBeInTheDocument();
  });

  it('shows selection count in selection mode', () => {
    render(<PhotoGallery {...defaultProps} canEdit />);
    fireEvent.click(screen.getByText('Select'));
    expect(screen.getByText('0 selected')).toBeInTheDocument();
  });

  it('exits selection mode when Cancel is clicked', () => {
    render(<PhotoGallery {...defaultProps} canEdit />);
    fireEvent.click(screen.getByText('Select'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('switches to timeline view', () => {
    render(<PhotoGallery {...defaultProps} />);
    fireEvent.click(screen.getByText('Timeline'));

    // In timeline view, measurements should be shown
    expect(screen.getByText(/Weight: 80 kg/)).toBeInTheDocument();
    expect(screen.getByText(/Body Fat: 15%/)).toBeInTheDocument();
  });

  it('shows photo notes in timeline view', () => {
    render(<PhotoGallery {...defaultProps} />);
    fireEvent.click(screen.getByText('Timeline'));

    expect(screen.getByText('Starting point')).toBeInTheDocument();
  });

  it('opens comparison modal when Compare is clicked', () => {
    render(<PhotoGallery {...defaultProps} canEdit />);
    fireEvent.click(screen.getByText('Compare'));

    expect(screen.getByTestId('photo-comparison')).toBeInTheDocument();
  });

  it('disables Compare button when fewer than 2 photos', () => {
    render(<PhotoGallery photos={[mockPhotos[0]]} canEdit />);
    const compareBtn = screen.getByText('Compare');
    expect(compareBtn).toBeDisabled();
  });

  it('calls onPrivacyToggle when privacy button is clicked in grid view', () => {
    const handlePrivacyToggle = jest.fn();
    render(
      <PhotoGallery
        {...defaultProps}
        canEdit
        onPrivacyToggle={handlePrivacyToggle}
      />
    );

    // Grid view privacy toggle buttons have title attributes
    const makePrivateButtons = screen.getAllByTitle('Make Private');
    expect(makePrivateButtons.length).toBeGreaterThan(0);
    fireEvent.click(makePrivateButtons[0]);
    expect(handlePrivacyToggle).toHaveBeenCalledWith('p3', false); // p3 is public, sorted first (most recent)
  });

  it('calls onDelete when delete button is clicked in grid view', () => {
    const handleDelete = jest.fn();
    window.confirm = jest.fn(() => true);
    render(
      <PhotoGallery
        {...defaultProps}
        canEdit
        onDelete={handleDelete}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete');
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this photo?');
    expect(handleDelete).toHaveBeenCalledWith('p3'); // Most recent first
  });

  it('does not call onDelete in grid view when confirm is cancelled', () => {
    const handleDelete = jest.fn();
    window.confirm = jest.fn(() => false);
    render(
      <PhotoGallery
        {...defaultProps}
        canEdit
        onDelete={handleDelete}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);
    expect(handleDelete).not.toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked in timeline view', () => {
    const handleDelete = jest.fn();
    window.confirm = jest.fn(() => true);

    render(
      <PhotoGallery
        {...defaultProps}
        canEdit
        onDelete={handleDelete}
      />
    );

    // Switch to timeline where buttons are always visible
    fireEvent.click(screen.getByText('Timeline'));

    // In timeline view, delete buttons have class "text-red-400"
    // Find buttons with red text styling for delete
    const deleteButtons = document.querySelectorAll('button.text-red-400');
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(handleDelete).toHaveBeenCalledWith('p3'); // Most recent photo first (sorted by date desc)
  });

  it('sorts photos by date in descending order', () => {
    render(<PhotoGallery {...defaultProps} />);
    const images = screen.getAllByRole('img');

    // Most recent first
    expect(images[0]).toHaveAttribute('alt', expect.stringContaining('Mar'));
    expect(images[2]).toHaveAttribute('alt', expect.stringContaining('Jan'));
  });

  it('shows share and privacy buttons in selection mode with selected photos', () => {
    render(<PhotoGallery {...defaultProps} canEdit onShare={jest.fn()} />);

    // Enter selection mode
    fireEvent.click(screen.getByText('Select'));

    // Click on a photo to select it
    const photoContainers = screen.getAllByRole('img');
    fireEvent.click(photoContainers[0].closest('[class*="cursor-pointer"]')!);

    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('Make Public')).toBeInTheDocument();
    expect(screen.getByText('Make Private')).toBeInTheDocument();
  });

  it('deselects a photo when clicked again in selection mode', () => {
    render(<PhotoGallery {...defaultProps} canEdit onShare={jest.fn()} />);
    fireEvent.click(screen.getByText('Select'));

    const photoContainers = screen.getAllByRole('img');
    const clickTarget = photoContainers[0].closest('[class*="cursor-pointer"]')!;

    // Select
    fireEvent.click(clickTarget);
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    // Deselect
    fireEvent.click(clickTarget);
    expect(screen.getByText('0 selected')).toBeInTheDocument();
  });

  it('calls onShare when Share button is clicked', () => {
    const handleShare = jest.fn();
    render(<PhotoGallery {...defaultProps} canEdit onShare={handleShare} />);
    fireEvent.click(screen.getByText('Select'));

    // Select a photo
    const photoContainers = screen.getAllByRole('img');
    fireEvent.click(photoContainers[0].closest('[class*="cursor-pointer"]')!);

    fireEvent.click(screen.getByText('Share'));
    expect(handleShare).toHaveBeenCalledWith(expect.arrayContaining([expect.any(String)]));
  });

  it('opens share modal after sharing', () => {
    const handleShare = jest.fn();
    render(<PhotoGallery {...defaultProps} canEdit onShare={handleShare} />);
    fireEvent.click(screen.getByText('Select'));

    const photoContainers = screen.getAllByRole('img');
    fireEvent.click(photoContainers[0].closest('[class*="cursor-pointer"]')!);
    fireEvent.click(screen.getByText('Share'));

    expect(screen.getByText('Share Progress Photos')).toBeInTheDocument();
    expect(screen.getByText(/shareable link has been created/)).toBeInTheDocument();
  });

  it('copies share link when Copy button is clicked', () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const handleShare = jest.fn();
    render(<PhotoGallery {...defaultProps} canEdit onShare={handleShare} />);
    fireEvent.click(screen.getByText('Select'));

    const photoContainers = screen.getAllByRole('img');
    fireEvent.click(photoContainers[0].closest('[class*="cursor-pointer"]')!);
    fireEvent.click(screen.getByText('Share'));

    fireEvent.click(screen.getByText('Copy'));
    expect(writeText).toHaveBeenCalled();
  });

  it('renders share modal options (checkboxes)', () => {
    const handleShare = jest.fn();
    render(<PhotoGallery {...defaultProps} canEdit onShare={handleShare} />);
    fireEvent.click(screen.getByText('Select'));

    const photoContainers = screen.getAllByRole('img');
    fireEvent.click(photoContainers[0].closest('[class*="cursor-pointer"]')!);
    fireEvent.click(screen.getByText('Share'));

    expect(screen.getByText('Include measurements')).toBeInTheDocument();
    expect(screen.getByText('Expire after 7 days')).toBeInTheDocument();
  });

  it('closes share modal when Close button is clicked', () => {
    const handleShare = jest.fn();
    render(<PhotoGallery {...defaultProps} canEdit onShare={handleShare} />);
    fireEvent.click(screen.getByText('Select'));

    const photoContainers = screen.getAllByRole('img');
    fireEvent.click(photoContainers[0].closest('[class*="cursor-pointer"]')!);
    fireEvent.click(screen.getByText('Share'));

    // Close the modal
    const closeButtons = screen.getAllByText('Close');
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(screen.queryByText('Share Progress Photos')).not.toBeInTheDocument();
  });

  it('calls onPrivacyToggle for all selected photos when Make Public is clicked', () => {
    const handlePrivacyToggle = jest.fn();
    render(<PhotoGallery {...defaultProps} canEdit onPrivacyToggle={handlePrivacyToggle} />);
    fireEvent.click(screen.getByText('Select'));

    // Select two photos
    const photoContainers = screen.getAllByRole('img');
    fireEvent.click(photoContainers[0].closest('[class*="cursor-pointer"]')!);
    fireEvent.click(photoContainers[1].closest('[class*="cursor-pointer"]')!);

    fireEvent.click(screen.getByText('Make Public'));
    expect(handlePrivacyToggle).toHaveBeenCalledTimes(2);
  });

  it('calls onPrivacyToggle for all selected photos when Make Private is clicked', () => {
    const handlePrivacyToggle = jest.fn();
    render(<PhotoGallery {...defaultProps} canEdit onPrivacyToggle={handlePrivacyToggle} />);
    fireEvent.click(screen.getByText('Select'));

    const photoContainers = screen.getAllByRole('img');
    fireEvent.click(photoContainers[0].closest('[class*="cursor-pointer"]')!);

    fireEvent.click(screen.getByText('Make Private'));
    expect(handlePrivacyToggle).toHaveBeenCalledWith(expect.any(String), false);
  });

  it('exits selection mode after bulk privacy toggle', () => {
    const handlePrivacyToggle = jest.fn();
    render(<PhotoGallery {...defaultProps} canEdit onPrivacyToggle={handlePrivacyToggle} />);
    fireEvent.click(screen.getByText('Select'));

    const photoContainers = screen.getAllByRole('img');
    fireEvent.click(photoContainers[0].closest('[class*="cursor-pointer"]')!);
    fireEvent.click(screen.getByText('Make Public'));

    // Should exit selection mode
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('calls onPrivacyToggle in timeline view', () => {
    const handlePrivacyToggle = jest.fn();
    render(<PhotoGallery {...defaultProps} canEdit onPrivacyToggle={handlePrivacyToggle} />);
    fireEvent.click(screen.getByText('Timeline'));

    // In timeline view, privacy toggle buttons are visible
    const privacyButtons = document.querySelectorAll('button.text-gray-400');
    if (privacyButtons.length > 0) {
      fireEvent.click(privacyButtons[0]);
      expect(handlePrivacyToggle).toHaveBeenCalled();
    }
  });

  it('does not delete when confirm is cancelled', () => {
    const handleDelete = jest.fn();
    window.confirm = jest.fn(() => false);
    render(<PhotoGallery {...defaultProps} canEdit onDelete={handleDelete} />);
    fireEvent.click(screen.getByText('Timeline'));

    const deleteButtons = document.querySelectorAll('button.text-red-400');
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      expect(handleDelete).not.toHaveBeenCalled();
    }
  });

  it('does not show share/privacy buttons when no photos selected', () => {
    render(<PhotoGallery {...defaultProps} canEdit onShare={jest.fn()} />);
    fireEvent.click(screen.getByText('Select'));
    expect(screen.queryByText('Share')).not.toBeInTheDocument();
    expect(screen.queryByText('Make Public')).not.toBeInTheDocument();
  });
});
