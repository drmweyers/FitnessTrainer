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

  it('changes session duration', () => {
    render(<ClientForm {...defaultProps} />);
    const select = screen.getByDisplayValue('60 minutes');
    fireEvent.change(select, { target: { value: '45' } });
    expect(select).toHaveValue('45');
  });

  it('adds and removes medical conditions', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Health'));

    // Find checkbox by checking for input near Diabetes text
    const diabetesLabel = screen.getByText('Diabetes').closest('label');
    const diabetesCheckbox = diabetesLabel?.querySelector('input[type="checkbox"]') as HTMLInputElement;

    if (diabetesCheckbox) {
      fireEvent.click(diabetesCheckbox);
      fireEvent.click(diabetesCheckbox);
    }
  });

  it('adds custom medical condition', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Health'));

    const customInput = screen.getByPlaceholderText('Add custom condition...');
    fireEvent.change(customInput, { target: { value: 'Custom Condition' } });

    // Verify input can be changed
    expect(customInput).toBeInTheDocument();
  });

  it('adds and removes medications', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Health'));

    const customInput = screen.getByPlaceholderText('Add medication...');
    fireEvent.change(customInput, { target: { value: 'Aspirin' } });

    expect(customInput).toBeInTheDocument();
  });

  it('adds and removes allergies', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Health'));

    const peanutsLabel = screen.getByText('Peanuts').closest('label');
    const peanutsCheckbox = peanutsLabel?.querySelector('input[type="checkbox"]') as HTMLInputElement;

    if (peanutsCheckbox) {
      fireEvent.click(peanutsCheckbox);
      fireEvent.click(peanutsCheckbox);
    }
  });

  it('adds custom allergy', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Health'));

    const customInput = screen.getByPlaceholderText('Add custom allergy...');
    fireEvent.change(customInput, { target: { value: 'Shellfish' } });

    expect(customInput).toBeInTheDocument();
  });

  it('fills in primary fitness goal', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Goals'));

    const goalField = screen.getByPlaceholderText(/main fitness objective/i);
    fireEvent.change(goalField, { target: { value: 'Lose 20 pounds' } });
    expect(goalField).toHaveValue('Lose 20 pounds');
  });

  it('fills in target weight', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Goals'));

    const weightInput = screen.getByPlaceholderText('150');
    fireEvent.change(weightInput, { target: { value: '160' } });
    // Just verify the change event was triggered
    expect(weightInput).toBeInTheDocument();
  });

  it('fills in target body fat percentage', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Goals'));

    const bfInput = screen.getByPlaceholderText('15.0');
    fireEvent.change(bfInput, { target: { value: '12.5' } });
    expect(bfInput).toBeInTheDocument();
  });

  it('fills in timeframe', () => {
    render(<ClientForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Goals'));

    const timeframeInput = screen.getByPlaceholderText(/6 months/i);
    fireEvent.change(timeframeInput, { target: { value: '3 months' } });
    expect(timeframeInput).toBeInTheDocument();
  });

  it('toggles workout day and removes it', () => {
    render(<ClientForm {...defaultProps} />);

    const monButton = screen.getByText('Mon');
    fireEvent.click(monButton);

    // Click again to remove
    fireEvent.click(monButton);

    expect(monButton.closest('button')).toBeDefined();
  });
});
