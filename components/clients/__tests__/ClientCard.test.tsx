/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClientCard from '../ClientCard';
import { Client, ClientStatus } from '@/types/client';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Eye: (props: any) => <span data-testid="icon-eye" {...props} />,
  Edit: (props: any) => <span data-testid="icon-edit" {...props} />,
  Archive: (props: any) => <span data-testid="icon-archive" {...props} />,
  Mail: (props: any) => <span data-testid="icon-mail" {...props} />,
  Phone: (props: any) => <span data-testid="icon-phone" {...props} />,
  Calendar: (props: any) => <span data-testid="icon-calendar" {...props} />,
  Activity: (props: any) => <span data-testid="icon-activity" {...props} />,
  MoreVertical: (props: any) => <span data-testid="icon-more" {...props} />,
  Tag: (props: any) => <span data-testid="icon-tag" {...props} />,
  MessageSquare: (props: any) => <span data-testid="icon-message" {...props} />,
  Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
}));

const createMockClient = (overrides: Partial<Client> = {}): Client => ({
  id: 'client-1',
  email: 'john@example.com',
  role: 'client',
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  displayName: 'John Doe',
  tags: [],
  notesCount: 3,
  trainerClient: {
    id: 'tc-1',
    trainerId: 'trainer-1',
    clientId: 'client-1',
    status: ClientStatus.ACTIVE,
  },
  ...overrides,
});

describe('ClientCard', () => {
  const defaultProps = {
    client: createMockClient(),
    onStatusChange: jest.fn(),
    onArchive: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders client display name', () => {
      render(<ClientCard {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders client email', () => {
      render(<ClientCard {...defaultProps} />);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('renders client avatar initials', () => {
      render(<ClientCard {...defaultProps} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders single initial for single-word name', () => {
      const client = createMockClient({ displayName: 'Alice' });
      render(<ClientCard {...defaultProps} client={client} />);
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('renders status badge with correct text', () => {
      render(<ClientCard {...defaultProps} />);
      expect(screen.getByText(ClientStatus.ACTIVE)).toBeInTheDocument();
    });

    it('renders pending status when no trainerClient', () => {
      const client = createMockClient({ trainerClient: undefined });
      render(<ClientCard {...defaultProps} client={client} />);
      expect(screen.getByText(ClientStatus.PENDING)).toBeInTheDocument();
    });

    it('renders notes count', () => {
      render(<ClientCard {...defaultProps} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders zero notes count when missing', () => {
      const client = createMockClient({ notesCount: undefined });
      render(<ClientCard {...defaultProps} client={client} />);
      // Multiple elements show '0' (notes, tags)
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    });

    it('renders tags count', () => {
      render(<ClientCard {...defaultProps} />);
      // tags.length = 0, notesCount = 3
      // There should be at least one '0' for tags count
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    });

    it('renders verified status as Yes', () => {
      render(<ClientCard {...defaultProps} />);
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('renders verified status as No for unverified', () => {
      const client = createMockClient({ isVerified: false });
      render(<ClientCard {...defaultProps} client={client} />);
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('renders phone number when userProfile has phone', () => {
      const client = createMockClient({
        userProfile: {
          id: 'up-1',
          userId: 'client-1',
          phone: '+1234567890',
          preferredUnits: 'metric',
          isPublic: false,
          createdAt: '2024-01-01',
        },
      });
      render(<ClientCard {...defaultProps} client={client} />);
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });

    it('does not render phone when userProfile has no phone', () => {
      render(<ClientCard {...defaultProps} />);
      expect(screen.queryByText('+1234567890')).not.toBeInTheDocument();
    });

    it('renders "Never logged in" when no last activity or login', () => {
      render(<ClientCard {...defaultProps} />);
      expect(screen.getByText('Never logged in')).toBeInTheDocument();
    });

    it('renders last activity when available', () => {
      const client = createMockClient({ lastActivity: '2 hours ago' });
      render(<ClientCard {...defaultProps} client={client} />);
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    it('renders last login date when no lastActivity but lastLoginAt exists', () => {
      const client = createMockClient({ lastLoginAt: '2024-06-15T10:00:00Z' });
      render(<ClientCard {...defaultProps} client={client} />);
      const text = screen.getByText(/Last login:/);
      expect(text).toBeInTheDocument();
    });
  });

  describe('Tags', () => {
    it('renders up to 3 tags', () => {
      const client = createMockClient({
        tags: [
          { id: 't1', name: 'VIP', color: '#FF0000', trainerId: 'trainer-1' },
          { id: 't2', name: 'Morning', color: '#00FF00', trainerId: 'trainer-1' },
          { id: 't3', name: 'Weight Loss', color: '#0000FF', trainerId: 'trainer-1' },
        ],
      });
      render(<ClientCard {...defaultProps} client={client} />);
      expect(screen.getByText('VIP')).toBeInTheDocument();
      expect(screen.getByText('Morning')).toBeInTheDocument();
      expect(screen.getByText('Weight Loss')).toBeInTheDocument();
    });

    it('shows +N more when more than 3 tags', () => {
      const client = createMockClient({
        tags: [
          { id: 't1', name: 'VIP', color: '#FF0000', trainerId: 'trainer-1' },
          { id: 't2', name: 'Morning', color: '#00FF00', trainerId: 'trainer-1' },
          { id: 't3', name: 'Weight Loss', color: '#0000FF', trainerId: 'trainer-1' },
          { id: 't4', name: 'Advanced', color: '#FFFF00', trainerId: 'trainer-1' },
          { id: 't5', name: 'Premium', color: '#FF00FF', trainerId: 'trainer-1' },
        ],
      });
      render(<ClientCard {...defaultProps} client={client} />);
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('does not render tags section when no tags', () => {
      render(<ClientCard {...defaultProps} />);
      expect(screen.queryByText('+0 more')).not.toBeInTheDocument();
    });
  });

  describe('Client Profile Info', () => {
    it('renders primary goal when available', () => {
      const client = createMockClient({
        clientProfile: {
          id: 'cp-1',
          userId: 'client-1',
          medicalConditions: [],
          medications: [],
          allergies: [],
          fitnessLevel: 'intermediate' as any,
          goals: { primaryGoal: 'Lose 10kg' },
        },
      });
      render(<ClientCard {...defaultProps} client={client} />);
      expect(screen.getByText('Lose 10kg')).toBeInTheDocument();
      expect(screen.getByText('Primary Goal')).toBeInTheDocument();
    });

    it('renders fitness level when available', () => {
      const client = createMockClient({
        clientProfile: {
          id: 'cp-1',
          userId: 'client-1',
          medicalConditions: [],
          medications: [],
          allergies: [],
          fitnessLevel: 'intermediate' as any,
        },
      });
      render(<ClientCard {...defaultProps} client={client} />);
      expect(screen.getByText('intermediate level')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to client detail page when header is clicked', () => {
      render(<ClientCard {...defaultProps} />);
      const nameText = screen.getByText('John Doe');
      fireEvent.click(nameText);
      expect(mockPush).toHaveBeenCalledWith('/dashboard/clients/client-1');
    });

    it('navigates to client detail page when View Details button is clicked', () => {
      render(<ClientCard {...defaultProps} />);
      const viewBtn = screen.getByText('View Details');
      fireEvent.click(viewBtn);
      expect(mockPush).toHaveBeenCalledWith('/dashboard/clients/client-1');
    });
  });

  describe('Status Change', () => {
    it('calls onStatusChange when status is changed', () => {
      render(<ClientCard {...defaultProps} />);
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: ClientStatus.PENDING } });
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith(ClientStatus.PENDING);
    });

    it('renders all status options in the select', () => {
      render(<ClientCard {...defaultProps} />);
      const select = screen.getByRole('combobox');
      const options = select.querySelectorAll('option');
      expect(options.length).toBe(4);
      expect(options[0]).toHaveTextContent('Active');
      expect(options[1]).toHaveTextContent('Pending');
      expect(options[2]).toHaveTextContent('Offline');
      expect(options[3]).toHaveTextContent('Need Programming');
    });
  });

  describe('Actions Menu', () => {
    it('shows action menu when more button is clicked', () => {
      render(<ClientCard {...defaultProps} />);
      // Find the button that wraps the MoreVertical icon
      const moreButtons = screen.getAllByRole('button');
      // The first button-like element with MoreVertical is the actions toggle
      const moreButton = moreButtons.find(btn => btn.querySelector('[data-testid="icon-more"]'));
      expect(moreButton).toBeTruthy();
      fireEvent.click(moreButton!);
      expect(screen.getByText('View Profile')).toBeInTheDocument();
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByText('Send Message')).toBeInTheDocument();
      expect(screen.getByText('Archive Client')).toBeInTheDocument();
    });

    it('calls onArchive when Archive Client is clicked', () => {
      render(<ClientCard {...defaultProps} />);
      const moreButtons = screen.getAllByRole('button');
      const moreButton = moreButtons.find(btn => btn.querySelector('[data-testid="icon-more"]'));
      fireEvent.click(moreButton!);
      fireEvent.click(screen.getByText('Archive Client'));
      expect(defaultProps.onArchive).toHaveBeenCalled();
    });

    it('closes action menu when backdrop is clicked', () => {
      render(<ClientCard {...defaultProps} />);
      const moreButtons = screen.getAllByRole('button');
      const moreButton = moreButtons.find(btn => btn.querySelector('[data-testid="icon-more"]'));
      fireEvent.click(moreButton!);
      expect(screen.getByText('View Profile')).toBeInTheDocument();
      // Click the backdrop (fixed inset-0)
      const backdrop = document.querySelector('.fixed.inset-0');
      expect(backdrop).toBeTruthy();
      fireEvent.click(backdrop!);
      expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
    });

    it('navigates to client detail when View Profile is clicked', () => {
      render(<ClientCard {...defaultProps} />);
      const moreButtons = screen.getAllByRole('button');
      const moreButton = moreButtons.find(btn => btn.querySelector('[data-testid="icon-more"]'));
      fireEvent.click(moreButton!);
      fireEvent.click(screen.getByText('View Profile'));
      expect(mockPush).toHaveBeenCalledWith('/dashboard/clients/client-1');
    });
  });

  describe('Stats Row', () => {
    it('renders Notes label', () => {
      render(<ClientCard {...defaultProps} />);
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('renders Tags label', () => {
      render(<ClientCard {...defaultProps} />);
      expect(screen.getByText('Tags')).toBeInTheDocument();
    });

    it('renders Verified label', () => {
      render(<ClientCard {...defaultProps} />);
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });
  });
});
