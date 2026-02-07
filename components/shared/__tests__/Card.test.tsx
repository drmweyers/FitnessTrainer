/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from '../Card';

describe('Card Component', () => {
  describe('Main Card', () => {
    it('renders children', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('renders with default variant (bg-white shadow)', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('shadow');
      expect(card).toHaveClass('rounded-lg');
    });

    it('renders with outline variant', () => {
      const { container } = render(<Card variant="outline">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-gray-200');
      expect(card).not.toHaveClass('bg-white');
    });

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    it('renders with padding by default', () => {
      const { container } = render(<Card>Content</Card>);
      const contentWrapper = container.querySelector('.p-6');
      expect(contentWrapper).toBeInTheDocument();
    });

    it('renders without padding when noPadding is true', () => {
      const { container } = render(<Card noPadding>Content</Card>);
      // The content div should NOT have p-6
      const contentDiv = container.firstChild?.childNodes[0] as HTMLElement;
      expect(contentDiv).not.toHaveClass('p-6');
    });

    it('renders header when provided as string', () => {
      render(<Card header="Card Header">Content</Card>);
      expect(screen.getByText('Card Header')).toBeInTheDocument();
      // String header gets wrapped in h3
      const h3 = screen.getByText('Card Header');
      expect(h3.tagName).toBe('H3');
    });

    it('renders header when provided as React element', () => {
      render(
        <Card header={<div data-testid="custom-header">Custom Header</div>}>
          Content
        </Card>
      );
      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    });

    it('renders footer when provided', () => {
      render(<Card footer={<div data-testid="card-footer">Footer</div>}>Content</Card>);
      expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    });

    it('does not render header section when header is undefined', () => {
      const { container } = render(<Card>Content</Card>);
      const headerDiv = container.querySelector('.border-b.border-gray-200.px-6.py-4');
      expect(headerDiv).not.toBeInTheDocument();
    });

    it('does not render footer section when footer is undefined', () => {
      const { container } = render(<Card>Content</Card>);
      const footerDiv = container.querySelector('.border-t');
      expect(footerDiv).not.toBeInTheDocument();
    });

    it('passes through HTML attributes', () => {
      render(<Card data-testid="test-card" role="article">Content</Card>);
      expect(screen.getByTestId('test-card')).toBeInTheDocument();
      expect(screen.getByRole('article')).toBeInTheDocument();
    });
  });

  describe('Card.Header', () => {
    it('renders with correct styles', () => {
      render(
        <Card>
          <Card.Header data-testid="card-header">Header Content</Card.Header>
        </Card>
      );
      const header = screen.getByTestId('card-header');
      expect(header).toHaveClass('px-6');
      expect(header).toHaveClass('py-4');
      expect(header).toHaveClass('border-b');
      expect(header).toHaveClass('border-gray-200');
    });

    it('applies custom className', () => {
      render(
        <Card>
          <Card.Header className="custom-header" data-testid="card-header">Header</Card.Header>
        </Card>
      );
      expect(screen.getByTestId('card-header')).toHaveClass('custom-header');
    });
  });

  describe('Card.Title', () => {
    it('renders as h3 with correct styles', () => {
      render(
        <Card>
          <Card.Title>Title</Card.Title>
        </Card>
      );
      const title = screen.getByText('Title');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-medium');
    });

    it('applies custom className', () => {
      render(
        <Card>
          <Card.Title className="custom-title">Title</Card.Title>
        </Card>
      );
      expect(screen.getByText('Title')).toHaveClass('custom-title');
    });
  });

  describe('Card.Description', () => {
    it('renders as paragraph with correct styles', () => {
      render(
        <Card>
          <Card.Description>Description text</Card.Description>
        </Card>
      );
      const desc = screen.getByText('Description text');
      expect(desc.tagName).toBe('P');
      expect(desc).toHaveClass('text-sm');
      expect(desc).toHaveClass('text-gray-500');
    });

    it('applies custom className', () => {
      render(
        <Card>
          <Card.Description className="custom-desc">Desc</Card.Description>
        </Card>
      );
      expect(screen.getByText('Desc')).toHaveClass('custom-desc');
    });
  });

  describe('Card.Content', () => {
    it('renders with p-6 by default', () => {
      render(
        <Card>
          <Card.Content data-testid="card-content">Content</Card.Content>
        </Card>
      );
      expect(screen.getByTestId('card-content')).toHaveClass('p-6');
    });

    it('applies custom className', () => {
      render(
        <Card>
          <Card.Content className="p-0" data-testid="card-content">Content</Card.Content>
        </Card>
      );
      expect(screen.getByTestId('card-content')).toHaveClass('p-0');
    });
  });

  describe('Card.Footer', () => {
    it('renders with correct styles', () => {
      render(
        <Card>
          <Card.Footer data-testid="card-footer">Footer</Card.Footer>
        </Card>
      );
      const footer = screen.getByTestId('card-footer');
      expect(footer).toHaveClass('px-6');
      expect(footer).toHaveClass('py-4');
      expect(footer).toHaveClass('border-t');
      expect(footer).toHaveClass('border-gray-200');
      expect(footer).toHaveClass('bg-gray-50');
    });

    it('applies custom className', () => {
      render(
        <Card>
          <Card.Footer className="custom-footer" data-testid="card-footer">Footer</Card.Footer>
        </Card>
      );
      expect(screen.getByTestId('card-footer')).toHaveClass('custom-footer');
    });
  });

  describe('Composition', () => {
    it('renders a complete card with all subcomponents', () => {
      render(
        <Card>
          <Card.Header>
            <Card.Title>Complete Card</Card.Title>
            <Card.Description>A full example</Card.Description>
          </Card.Header>
          <Card.Content>
            <p>Main content area</p>
          </Card.Content>
          <Card.Footer>
            <button>Action</button>
          </Card.Footer>
        </Card>
      );

      expect(screen.getByText('Complete Card')).toBeInTheDocument();
      expect(screen.getByText('A full example')).toBeInTheDocument();
      expect(screen.getByText('Main content area')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });
});
