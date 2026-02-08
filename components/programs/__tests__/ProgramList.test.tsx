/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ProgramList } from '../ProgramList';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/programs',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

const mockPrograms = [
  {
    id: 'prog-1',
    name: 'Strength Builder',
    description: 'Build strength with compound movements',
    programType: 'STRENGTH',
    difficultyLevel: 'INTERMEDIATE',
    durationWeeks: 12,
    isActive: true,
    _count: { assignments: 5 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
  },
];

jest.mock('@/hooks/usePrograms', () => ({
  usePrograms: () => ({ data: mockPrograms, isLoading: false, error: null }),
  useDeleteProgram: () => ({ mutateAsync: jest.fn() }),
  useDuplicateProgram: () => ({ mutateAsync: jest.fn() }),
}));

// Mock Radix UI Select components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  DropdownMenuTrigger: ({ children, asChild, ...props }: any) => <button {...props}>{children}</button>,
}));

describe('ProgramList', () => {
  it('renders the program list', () => {
    render(<ProgramList />);
    expect(screen.getByText('Strength Builder')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<ProgramList />);
    expect(screen.getByPlaceholderText('Search programs...')).toBeInTheDocument();
  });

  it('renders create program button', () => {
    render(<ProgramList />);
    expect(screen.getByText('Create Program')).toBeInTheDocument();
  });

  it('renders program type filter', () => {
    render(<ProgramList />);
    expect(screen.getByText('Program Type')).toBeInTheDocument();
  });

  it('renders difficulty filter', () => {
    render(<ProgramList />);
    expect(screen.getByText('Difficulty')).toBeInTheDocument();
  });
});
