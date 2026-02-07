/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Filter: () => <span data-testid="icon-filter" />,
  Bell: () => <span data-testid="icon-bell" />,
  Settings: () => <span data-testid="icon-settings" />,
  ChevronDown: () => <span data-testid="icon-chevron" />,
  Menu: () => <span data-testid="icon-menu" />,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import Header from '../Header';

describe('Header', () => {
  const mockOnMenuClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the header', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should render the brand name', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);
    expect(screen.getByText('EvoFit Fitness')).toBeInTheDocument();
  });

  it('should render the logo', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });

  it('should render bell icon button', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);
    expect(screen.getByTestId('icon-bell')).toBeInTheDocument();
  });

  it('should render settings icon button', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);
    expect(screen.getByTestId('icon-settings')).toBeInTheDocument();
  });

  it('should render user info', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Fitness Trainer')).toBeInTheDocument();
  });

  it('should call onMenuClick when menu button is clicked', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);
    const menuBtn = screen.getByTestId('icon-menu').closest('button')!;
    fireEvent.click(menuBtn);
    expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
  });

  it('should render profile image', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);
    expect(screen.getByAltText('Profile')).toBeInTheDocument();
  });
});
