import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from '../src/dashboard/EmptyState';

describe('EmptyState', () => {
  it('renders without crashing', () => {
    render(<EmptyState />);
  });

  it('displays the expected empty state message', () => {
    render(<EmptyState />);
    expect(
      screen.getByText('No trips logged yet. Add your first trip to start tracking.')
    ).toBeInTheDocument();
  });

  it('renders the message inside a div element', () => {
    const { container } = render(<EmptyState />);
    const div = container.firstChild;
    expect(div).not.toBeNull();
    expect(div?.nodeName).toBe('DIV');
  });

  it('applies the text-gray-500 CSS class', () => {
    const { container } = render(<EmptyState />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('text-gray-500');
  });

  it('applies the text-center CSS class', () => {
    const { container } = render(<EmptyState />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('text-center');
  });

  it('applies the py-16 CSS class', () => {
    const { container } = render(<EmptyState />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('py-16');
  });

  it('applies all required CSS classes together', () => {
    const { container } = render(<EmptyState />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('text-gray-500', 'text-center', 'py-16');
  });

  it('renders only a single root element', () => {
    const { container } = render(<EmptyState />);
    expect(container.childElementCount).toBe(1);
  });

  it('does not render any child elements inside the div', () => {
    const { container } = render(<EmptyState />);
    const div = container.firstChild as HTMLElement;
    expect(div.childElementCount).toBe(0);
  });

  it('the message text is accessible as visible text content', () => {
    render(<EmptyState />);
    const element = screen.getByText(/No trips logged yet/i);
    expect(element).toBeVisible();
  });

  it('contains the full message text as the text content of the div', () => {
    const { container } = render(<EmptyState />);
    const div = container.firstChild as HTMLElement;
    expect(div.textContent).toBe(
      'No trips logged yet. Add your first trip to start tracking.'
    );
  });

  it('renders consistently across multiple renders', () => {
    const { container: container1 } = render(<EmptyState />);
    const { container: container2 } = render(<EmptyState />);
    expect(container1.innerHTML).toBe(container2.innerHTML);
  });
});