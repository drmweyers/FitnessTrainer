/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientForm from '../ClientForm';
import { FitnessLevel } from '@/types/client';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

describe('ClientForm', () => {
  const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with Add New Client title when no client is provided', () => {
    render(<ClientForm {...defaultProps} />);
    expect(screen.getByText('Add New Client')).toBeInTheDocument();
    expect(screen.getByText('Create Client')).toBeInTheDocument();
  });

  it('renders the form with Edit Client title when client is provided', () => {
    const client = {
      id: '1',
      email: 'test@example.com',
      displayName: 'Test User',
      userProfile: { id: '1', userId: '1', bio: 'John Doe' },
      clientProfile: {
        id: '1',
        userId: '1',
        fitnessLevel: FitnessLevel.INTERMEDIATE,
        medicalConditions: [],
        medications: [],
        allergies: [],
      },
    } as any;

    render(<ClientForm {...defaultProps} client={client} />);
    expect(screen.getByText('Edit Client')).toBeInTheDocument();
    expect(screen.getByText('Update Client')).toBeInTheDocument();
  });

  it('shows all four tabs', () => {
    render(<ClientForm {...defaultProps} />);
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Emergency')).toBeInTheDocument();
  });

  it('renders basic info fields on the first tab', () => {
    render(<ClientForm {...defaultProps} />);
    expect(screen.getByPlaceholderText('client@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument();
  });

  it('switches tabs when clicked', () => {
    render(<ClientForm {...defaultProps} />);

    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getByText('Primary Fitness Goal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Health'));
    expect(screen.getByText('Medical Conditions')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Emergency'));
    expect(screen.getByText('Emergency Contact Information')).toBeInTheDocument();
  });

  it('shows fitness level select with beginner, intermediate, advanced options', () => {
    render(<ClientForm {...defaultProps} />);
    const select = screen.getByDisplayValue('Beginner');
    expect(select).toBeInTheDocument();
  });

  it('shows workout day checkboxes', () => {
    render(<ClientForm {...defaultProps} />);
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    render(<ClientForm {...defaultProps} />);
    const cancelButtons = screen.getAllByText('Cancel');
    fireEvent.click(cancelButtons[0]);
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows error when submitting without email', async () => {
    render(<ClientForm {...defaultProps} />);
    const createButton = screen.getByText('Create Client');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('calls onSubmit with form data when valid', async () => {
    render(<ClientForm {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText('client@example.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const createButton = screen.getByText('Create Client');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });
  });

  it('shows session duration select with correct options', () => {
    render(<ClientForm {...defaultProps} />);
    expect(screen.getByText('30 minutes')).toBeInTheDocument();
    expect(screen.getByText('45 minutes')).toBeInTheDocument();
    expect(screen.getByText('60 minutes')).toBeInTheDocument();
    expect(screen.getByText('90 minutes')).toBeInTheDocument();
  });

  it('renders medical conditions on health tab', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Health'));
    expect(screen.getByText('Diabetes')).toBeInTheDocument();
    expect(screen.getByText('High Blood Pressure')).toBeInTheDocument();
    expect(screen.getByText('Asthma')).toBeInTheDocument();
  });

  it('renders common allergies on health tab', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Health'));
    expect(screen.getByText('Peanuts')).toBeInTheDocument();
    expect(screen.getByText('Gluten')).toBeInTheDocument();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
  });

  it('renders emergency contact fields on emergency tab', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Emergency'));
    expect(screen.getByPlaceholderText('John Smith')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Spouse, Parent, etc.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('(555) 123-4567')).toBeInTheDocument();
  });
});
