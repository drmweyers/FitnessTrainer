/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActivityFeed from '../ActivityFeed';
import { ActivityFeedItem } from '@/types/dashboard';

const createMockActivities = (count: number = 3): ActivityFeedItem[] => {
  const types: ActivityFeedItem['type'][] = [
    'client_signup',
    'workout_completed',
    'program_assigned',
    'milestone_reached',
    'system_event',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `activity-${i + 1}`,
    type: types[i % types.length],
    title: `Activity ${i + 1}`,
    description: `Description for activity ${i + 1}`,
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    ...(i === 0
      ? {
          user: {
            id: 'user-1',
            name: 'John Doe',
          },
        }
      : {}),
  }));
};

describe('ActivityFeed', () => {
  describe('Empty State', () => {
    it('shows default empty message when no activities', () => {
      render(<ActivityFeed activities={[]} />);
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });

    it('shows custom empty message', () => {
      render(<ActivityFeed activities={[]} emptyMessage="Nothing here yet" />);
      expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    });
  });

  describe('Rendering Activities', () => {
    it('renders header with "Recent Activity"', () => {
      const activities = createMockActivities(2);
      render(<ActivityFeed activities={activities} />);
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('renders all activities', () => {
      const activities = createMockActivities(3);
      render(<ActivityFeed activities={activities} />);
      expect(screen.getByText('Activity 1')).toBeInTheDocument();
      expect(screen.getByText('Activity 2')).toBeInTheDocument();
      expect(screen.getByText('Activity 3')).toBeInTheDocument();
    });

    it('renders activity descriptions', () => {
      const activities = createMockActivities(2);
      render(<ActivityFeed activities={activities} />);
      expect(screen.getByText('Description for activity 1')).toBeInTheDocument();
      expect(screen.getByText('Description for activity 2')).toBeInTheDocument();
    });

    it('renders user info when available', () => {
      const activities = createMockActivities(1);
      render(<ActivityFeed activities={activities} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // User initial
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('does not render user info when not available', () => {
      const activities: ActivityFeedItem[] = [
        {
          id: '1',
          type: 'system_event',
          title: 'System Update',
          description: 'App updated',
          timestamp: new Date().toISOString(),
        },
      ];
      render(<ActivityFeed activities={activities} />);
      expect(screen.queryByText('J')).not.toBeInTheDocument();
    });
  });

  describe('maxItems', () => {
    it('limits displayed activities when maxItems is set', () => {
      const activities = createMockActivities(5);
      render(<ActivityFeed activities={activities} maxItems={2} />);
      expect(screen.getByText('Activity 1')).toBeInTheDocument();
      expect(screen.getByText('Activity 2')).toBeInTheDocument();
      expect(screen.queryByText('Activity 3')).not.toBeInTheDocument();
    });

    it('displays all activities when maxItems is not set', () => {
      const activities = createMockActivities(5);
      render(<ActivityFeed activities={activities} />);
      expect(screen.getByText('Activity 1')).toBeInTheDocument();
      expect(screen.getByText('Activity 5')).toBeInTheDocument();
    });
  });

  describe('Load More', () => {
    it('shows Load More button when showLoadMore is true and more items exist', () => {
      const activities = createMockActivities(5);
      const onLoadMore = jest.fn();
      render(
        <ActivityFeed
          activities={activities}
          maxItems={3}
          showLoadMore={true}
          onLoadMore={onLoadMore}
        />
      );
      expect(screen.getByText('Load more activities')).toBeInTheDocument();
    });

    it('calls onLoadMore when Load More is clicked', () => {
      const activities = createMockActivities(5);
      const onLoadMore = jest.fn();
      render(
        <ActivityFeed
          activities={activities}
          maxItems={3}
          showLoadMore={true}
          onLoadMore={onLoadMore}
        />
      );
      fireEvent.click(screen.getByText('Load more activities'));
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('does not show Load More when showLoadMore is false', () => {
      const activities = createMockActivities(5);
      render(
        <ActivityFeed
          activities={activities}
          maxItems={3}
          showLoadMore={false}
        />
      );
      expect(screen.queryByText('Load more activities')).not.toBeInTheDocument();
    });

    it('does not show Load More when all items are displayed', () => {
      const activities = createMockActivities(3);
      const onLoadMore = jest.fn();
      render(
        <ActivityFeed
          activities={activities}
          maxItems={5}
          showLoadMore={true}
          onLoadMore={onLoadMore}
        />
      );
      expect(screen.queryByText('Load more activities')).not.toBeInTheDocument();
    });

    it('does not show Load More when onLoadMore is not provided', () => {
      const activities = createMockActivities(5);
      render(
        <ActivityFeed
          activities={activities}
          maxItems={3}
          showLoadMore={true}
        />
      );
      expect(screen.queryByText('Load more activities')).not.toBeInTheDocument();
    });
  });

  describe('Activity Types & Icons', () => {
    it('renders correct icon containers for different activity types', () => {
      const activities: ActivityFeedItem[] = [
        {
          id: '1',
          type: 'client_signup',
          title: 'New Client',
          description: 'Client signed up',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'workout_completed',
          title: 'Workout Done',
          description: 'Workout completed',
          timestamp: new Date().toISOString(),
        },
        {
          id: '3',
          type: 'program_assigned',
          title: 'Program Assigned',
          description: 'Program was assigned',
          timestamp: new Date().toISOString(),
        },
        {
          id: '4',
          type: 'milestone_reached',
          title: 'Milestone',
          description: 'Milestone reached',
          timestamp: new Date().toISOString(),
        },
        {
          id: '5',
          type: 'system_event',
          title: 'System Event',
          description: 'System event occurred',
          timestamp: new Date().toISOString(),
        },
      ];
      const { container } = render(<ActivityFeed activities={activities} />);

      // Each activity type has a colored icon container
      expect(container.querySelector('.bg-green-100')).toBeInTheDocument();
      expect(container.querySelector('.bg-blue-100')).toBeInTheDocument();
      expect(container.querySelector('.bg-purple-100')).toBeInTheDocument();
      expect(container.querySelector('.bg-yellow-100')).toBeInTheDocument();
      expect(container.querySelector('.bg-gray-100')).toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    it('shows relative time for recent activities', () => {
      const activities: ActivityFeedItem[] = [
        {
          id: '1',
          type: 'system_event',
          title: 'Just Now',
          description: 'Recent event',
          timestamp: new Date().toISOString(),
        },
      ];
      render(<ActivityFeed activities={activities} />);
      // Should show "just now" or "0m ago"
      const timeText = screen.getByText(/just now|0m ago/);
      expect(timeText).toBeInTheDocument();
    });

    it('shows hours ago for activities within 24 hours', () => {
      const activities: ActivityFeedItem[] = [
        {
          id: '1',
          type: 'system_event',
          title: 'Hours Ago',
          description: 'Recent event',
          timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
        },
      ];
      render(<ActivityFeed activities={activities} />);
      expect(screen.getByText('3h ago')).toBeInTheDocument();
    });

    it('shows days ago for activities within a week', () => {
      const activities: ActivityFeedItem[] = [
        {
          id: '1',
          type: 'system_event',
          title: 'Days Ago',
          description: 'Recent event',
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
      ];
      render(<ActivityFeed activities={activities} />);
      expect(screen.getByText('3d ago')).toBeInTheDocument();
    });
  });
});
