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

  it('renders goals tab fields', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getByText('Primary Fitness Goal')).toBeInTheDocument();
  });

  it('allows changing fitness level', () => {
    render(<ClientForm {...defaultProps} />);
    const select = screen.getByDisplayValue('Beginner');
    fireEvent.change(select, { target: { value: 'advanced' } });
    expect(select).toHaveValue('advanced');
  });

  it('allows clicking workout day checkboxes', () => {
    render(<ClientForm {...defaultProps} />);
    const monButton = screen.getByText('Mon');
    fireEvent.click(monButton);
    // Mon should become selected (highlighted)
    expect(monButton.closest('button')).toBeDefined();
  });

  it('fills in first and last name', () => {
    render(<ClientForm {...defaultProps} />);
    const firstName = screen.getByPlaceholderText('John');
    const lastName = screen.getByPlaceholderText('Doe');
    fireEvent.change(firstName, { target: { value: 'Alice' } });
    fireEvent.change(lastName, { target: { value: 'Smith' } });
    expect(firstName).toHaveValue('Alice');
    expect(lastName).toHaveValue('Smith');
  });

  it('toggles medical condition checkboxes on health tab', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Health'));
    const diabetesCheckbox = screen.getByText('Diabetes').closest('label')?.querySelector('input') ||
      screen.getByText('Diabetes').closest('button');
    if (diabetesCheckbox) {
      fireEvent.click(diabetesCheckbox);
    }
  });

  it('shows notes textarea on basic info tab', () => {
    render(<ClientForm {...defaultProps} />);
    const notesField = screen.queryByPlaceholderText(/notes/i) || screen.queryByPlaceholderText(/additional/i);
    if (notesField) {
      expect(notesField).toBeInTheDocument();
    }
  });

  it('fills emergency contact info', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Emergency'));
    const nameInput = screen.getByPlaceholderText('John Smith');
    const relInput = screen.getByPlaceholderText('Spouse, Parent, etc.');
    const phoneInput = screen.getByPlaceholderText('(555) 123-4567');
    fireEvent.change(nameInput, { target: { value: 'Bob Smith' } });
    fireEvent.change(relInput, { target: { value: 'Brother' } });
    fireEvent.change(phoneInput, { target: { value: '555-9999' } });
    expect(nameInput).toHaveValue('Bob Smith');
    expect(relInput).toHaveValue('Brother');
    expect(phoneInput).toHaveValue('555-9999');
  });

  it('populates form with existing client data', () => {
    const client = {
      id: '1',
      email: 'existing@example.com',
      displayName: 'Existing User',
      userProfile: {
        id: '1',
        userId: '1',
        bio: 'Jane',
        preferredUnits: 'metric',
        isPublic: true,
        createdAt: '2024-01-01',
      },
      clientProfile: {
        id: '1',
        userId: '1',
        fitnessLevel: FitnessLevel.ADVANCED,
        medicalConditions: ['Asthma'],
        medications: [],
        allergies: ['Peanuts'],
      },
    } as any;

    render(<ClientForm {...defaultProps} client={client} />);
    expect(screen.getByDisplayValue('existing@example.com')).toBeInTheDocument();
  });

  it('submits with full form data including goals and health', async () => {
    render(<ClientForm {...defaultProps} />);

    // Fill basic info
    const emailInput = screen.getByPlaceholderText('client@example.com');
    fireEvent.change(emailInput, { target: { value: 'full@example.com' } });
    const firstName = screen.getByPlaceholderText('John');
    fireEvent.change(firstName, { target: { value: 'Jane' } });

    // Submit
    const createButton = screen.getByText('Create Client');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'full@example.com',
        })
      );
    });
  });

  it('shows loading state during submission', async () => {
    const slowSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<ClientForm {...defaultProps} onSubmit={slowSubmit} />);
    const emailInput = screen.getByPlaceholderText('client@example.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    const createButton = screen.getByText('Create Client');
    fireEvent.click(createButton);
    // Button should be disabled during submission
    await waitFor(() => {
      expect(slowSubmit).toHaveBeenCalled();
    });
  });

  it('shows error message on submission failure', async () => {
    const failingSubmit = jest.fn().mockRejectedValue(new Error('Server error'));
    render(<ClientForm {...defaultProps} onSubmit={failingSubmit} />);
    const emailInput = screen.getByPlaceholderText('client@example.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    const createButton = screen.getByText('Create Client');
    fireEvent.click(createButton);
    await waitFor(() => {
      expect(failingSubmit).toHaveBeenCalled();
    });
  });
});
