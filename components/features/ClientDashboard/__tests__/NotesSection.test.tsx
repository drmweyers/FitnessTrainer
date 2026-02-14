/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus" />,
  MessageSquare: () => <span data-testid="icon-message" />,
}));

import NotesSection from '../NotesSection';

describe('NotesSection', () => {
  const mockNotes = [
    { id: '1', date: '2024-03-15', text: 'Client showing good progress on bench press' },
    { id: '2', date: '2024-03-10', text: 'Adjusted squat form - need to focus on depth' },
  ];

  it('should render section title', () => {
    render(<NotesSection notes={mockNotes} />);
    expect(screen.getByText('Session Notes')).toBeInTheDocument();
  });

  it('should render all notes', () => {
    render(<NotesSection notes={mockNotes} />);
    expect(screen.getByText('Client showing good progress on bench press')).toBeInTheDocument();
    expect(screen.getByText('Adjusted squat form - need to focus on depth')).toBeInTheDocument();
  });

  it('should render note dates', () => {
    render(<NotesSection notes={mockNotes} />);
    // Dates format with toLocaleDateString - just check the year is present
    const dateElements = screen.getAllByText(/2024/);
    expect(dateElements.length).toBe(2);
  });

  it('should show empty state when no notes', () => {
    render(<NotesSection notes={[]} />);
    expect(screen.getByText('No notes yet')).toBeInTheDocument();
    expect(screen.getByTestId('icon-message')).toBeInTheDocument();
  });

  it('should show Add Note button', () => {
    render(<NotesSection notes={mockNotes} />);
    expect(screen.getByText('Add Note')).toBeInTheDocument();
  });

  it('should show add note form when Add Note is clicked', () => {
    render(<NotesSection notes={mockNotes} />);
    fireEvent.click(screen.getByText('Add Note'));
    expect(screen.getByPlaceholderText('Enter your note here...')).toBeInTheDocument();
    expect(screen.getByText('Save Note')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should hide add note form when Cancel is clicked', () => {
    render(<NotesSection notes={mockNotes} />);
    fireEvent.click(screen.getByText('Add Note'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Enter your note here...')).not.toBeInTheDocument();
  });

  it('should disable Save Note when textarea is empty', () => {
    render(<NotesSection notes={mockNotes} />);
    fireEvent.click(screen.getByText('Add Note'));
    expect(screen.getByText('Save Note')).toBeDisabled();
  });

  it('should enable Save Note when textarea has content', () => {
    render(<NotesSection notes={mockNotes} />);
    fireEvent.click(screen.getByText('Add Note'));
    const textarea = screen.getByPlaceholderText('Enter your note here...');
    fireEvent.change(textarea, { target: { value: 'New note content' } });
    expect(screen.getByText('Save Note')).not.toBeDisabled();
  });

  it('should disable Save Note when textarea contains only whitespace', () => {
    render(<NotesSection notes={mockNotes} />);
    fireEvent.click(screen.getByText('Add Note'));
    const textarea = screen.getByPlaceholderText('Enter your note here...');
    fireEvent.change(textarea, { target: { value: '   ' } });
    expect(screen.getByText('Save Note')).toBeDisabled();
  });

  it('should update textarea value when typing', () => {
    render(<NotesSection notes={mockNotes} />);
    fireEvent.click(screen.getByText('Add Note'));
    const textarea = screen.getByPlaceholderText('Enter your note here...') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'My new note' } });
    expect(textarea.value).toBe('My new note');
  });

  it('should clear textarea and hide form when Save Note is clicked', () => {
    render(<NotesSection notes={mockNotes} />);
    fireEvent.click(screen.getByText('Add Note'));
    const textarea = screen.getByPlaceholderText('Enter your note here...');
    fireEvent.change(textarea, { target: { value: 'New note content' } });
    fireEvent.click(screen.getByText('Save Note'));
    expect(screen.queryByPlaceholderText('Enter your note here...')).not.toBeInTheDocument();
  });

  it('should render note with formatted date', () => {
    const notes = [{ id: '1', date: '2024-12-25', text: 'Holiday workout' }];
    render(<NotesSection notes={notes} />);
    expect(screen.getByText('Holiday workout')).toBeInTheDocument();
    // Check for formatted date containing year
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('should show Plus icon in Add Note button', () => {
    render(<NotesSection notes={mockNotes} />);
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument();
  });

  it('should not show add form initially', () => {
    render(<NotesSection notes={mockNotes} />);
    expect(screen.queryByPlaceholderText('Enter your note here...')).not.toBeInTheDocument();
  });

  it('should render multiple notes correctly', () => {
    const manyNotes = [
      { id: '1', date: '2024-03-15', text: 'Note 1' },
      { id: '2', date: '2024-03-14', text: 'Note 2' },
      { id: '3', date: '2024-03-13', text: 'Note 3' },
    ];
    render(<NotesSection notes={manyNotes} />);
    expect(screen.getByText('Note 1')).toBeInTheDocument();
    expect(screen.getByText('Note 2')).toBeInTheDocument();
    expect(screen.getByText('Note 3')).toBeInTheDocument();
  });
});
