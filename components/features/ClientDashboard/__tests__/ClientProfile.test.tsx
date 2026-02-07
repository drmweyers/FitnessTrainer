/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Mail: () => <span data-testid="icon-mail" />,
  Phone: () => <span data-testid="icon-phone" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  Camera: () => <span data-testid="icon-camera" />,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

import ClientProfile from '../ClientProfile';

describe('ClientProfile', () => {
  const mockClient = {
    id: '1',
    name: 'John Smith',
    age: 32,
    email: 'john@example.com',
    phone: '555-1234',
    joinDate: '2024-01-15',
    profileImage: '/images/john.jpg',
    progressPhotos: [
      { id: 'p1', date: '2024-02-01', url: '/photos/front.jpg' },
      { id: 'p2', date: '2024-03-01', url: '/photos/side.jpg' },
    ],
  };

  it('should render client name', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('should render client age', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText('Age: 32')).toBeInTheDocument();
  });

  it('should render client email', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should render client phone', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  it('should render join date', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText(/Client since/)).toBeInTheDocument();
  });

  it('should render profile image', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByAltText('John Smith')).toBeInTheDocument();
  });

  it('should render progress photos section', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText('Progress Photos')).toBeInTheDocument();
  });

  it('should render Add Photo button', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByText('Add Photo')).toBeInTheDocument();
  });

  it('should render progress photo images', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByAltText('Progress photo 1')).toBeInTheDocument();
    expect(screen.getByAltText('Progress photo 2')).toBeInTheDocument();
  });

  it('should render contact icons', () => {
    render(<ClientProfile client={mockClient} />);
    expect(screen.getByTestId('icon-mail')).toBeInTheDocument();
    expect(screen.getByTestId('icon-phone')).toBeInTheDocument();
    expect(screen.getByTestId('icon-calendar')).toBeInTheDocument();
  });
});
