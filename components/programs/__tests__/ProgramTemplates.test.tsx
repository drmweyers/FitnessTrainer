/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgramTemplates } from '../ProgramTemplates';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/programs',
  useSearchParams: () => new URLSearchParams(),
}));

const mockTemplates = [
  {
    id: 'tpl-1',
    name: 'Beginner Strength',
    description: 'Perfect for beginners',
    category: 'strength',
    rating: 4.5,
    usageCount: 120,
    goals: ['Build Strength', 'Learn Form'],
    equipmentNeeded: ['Barbell', 'Dumbbells', 'Bench', 'Rack'],
    program: { difficultyLevel: 'beginner', durationWeeks: 8 },
  },
  {
    id: 'tpl-2',
    name: 'Advanced Hypertrophy',
    description: 'For experienced lifters',
    category: 'hypertrophy',
    rating: 4.8,
    usageCount: 85,
    goals: ['Gain Muscle'],
    equipmentNeeded: ['Dumbbells'],
    program: { difficultyLevel: 'advanced', durationWeeks: 12 },
  },
];

jest.mock('@/hooks/useProgramTemplates', () => ({
  useTemplates: () => ({ data: mockTemplates, isLoading: false }),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, onClick, ...props }: any) => <div onClick={onClick} {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

describe('ProgramTemplates', () => {
  const mockOnSelectTemplate = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    onSelectTemplate: mockOnSelectTemplate,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title', () => {
    render(<ProgramTemplates {...defaultProps} />);
    expect(screen.getByText('Program Templates')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<ProgramTemplates {...defaultProps} />);
    expect(screen.getByText('Start with a template and customize it')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<ProgramTemplates {...defaultProps} />);
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ProgramTemplates {...defaultProps} />);
    fireEvent.click(screen.getByText('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders search input', () => {
    render(<ProgramTemplates {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument();
  });

  it('renders template names', () => {
    render(<ProgramTemplates {...defaultProps} />);
    expect(screen.getByText('Beginner Strength')).toBeInTheDocument();
    expect(screen.getByText('Advanced Hypertrophy')).toBeInTheDocument();
  });

  it('renders template descriptions', () => {
    render(<ProgramTemplates {...defaultProps} />);
    expect(screen.getByText('Perfect for beginners')).toBeInTheDocument();
    expect(screen.getByText('For experienced lifters')).toBeInTheDocument();
  });

  it('renders template ratings', () => {
    render(<ProgramTemplates {...defaultProps} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('renders usage count', () => {
    render(<ProgramTemplates {...defaultProps} />);
    expect(screen.getByText('Used by 120 trainers')).toBeInTheDocument();
    expect(screen.getByText('Used by 85 trainers')).toBeInTheDocument();
  });

  it('renders preview and use template buttons', () => {
    render(<ProgramTemplates {...defaultProps} />);
    const previewButtons = screen.getAllByText('Preview');
    const useButtons = screen.getAllByText('Use Template');
    expect(previewButtons.length).toBe(2);
    expect(useButtons.length).toBe(2);
  });

  it('renders equipment info', () => {
    render(<ProgramTemplates {...defaultProps} />);
    expect(screen.getByText(/Equipment: Barbell, Dumbbells, Bench/)).toBeInTheDocument();
  });

  it('renders goals', () => {
    render(<ProgramTemplates {...defaultProps} />);
    expect(screen.getByText('Build Strength')).toBeInTheDocument();
    expect(screen.getByText('Learn Form')).toBeInTheDocument();
    expect(screen.getByText('Gain Muscle')).toBeInTheDocument();
  });

  it('renders category filter', () => {
    render(<ProgramTemplates {...defaultProps} />);
    expect(screen.getByText('Category')).toBeInTheDocument();
  });
});
