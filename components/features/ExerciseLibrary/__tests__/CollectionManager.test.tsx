/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { CollectionManager } from '../CollectionManager';

jest.mock('lucide-react', () => ({
  BookOpen: () => <span data-testid="icon-book" />,
  Plus: () => <span data-testid="icon-plus" />,
}));

describe('CollectionManager', () => {
  it('renders the title', () => {
    render(<CollectionManager />);
    expect(screen.getByText('Collections Feature')).toBeInTheDocument();
  });

  it('renders coming soon message', () => {
    render(<CollectionManager />);
    expect(screen.getByText('Collection management coming soon!')).toBeInTheDocument();
  });

  it('renders create collection button', () => {
    render(<CollectionManager />);
    expect(screen.getByText('Create Collection')).toBeInTheDocument();
  });

  it('renders book icon', () => {
    render(<CollectionManager />);
    expect(screen.getByTestId('icon-book')).toBeInTheDocument();
  });
});
