import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { ProgressBar } from '../src/dashboard/ProgressBar';

describe('ProgressBar', () => {
  describe('color thresholds', () => {
    it('renders emerald bar when percentage is below 60', () => {
      const { container } = render(<ProgressBar percentage={30} />);
      const inner = container.querySelector('div > div > div');
      expect(inner).toHaveClass('bg-emerald-500');
      expect(inner).not.toHaveClass('bg-amber-400');
      expect(inner).not.toHaveClass('bg-red-500');
    });

    it('renders emerald bar when percentage is exactly 0', () => {
      const { container } = render(<ProgressBar percentage={0} />);
      const inner = container.querySelector('div > div > div');
      expect(inner).toHaveClass('bg-emerald-500');
    });

    it('renders emerald bar when percentage is just below 60', () => {
      const { container } = render(<ProgressBar percentage={59} />);
      const inner = container.querySelector('div > div > div');
      expect(inner).toHaveClass('bg-emerald-500');
    });

    it('renders amber bar when percentage is exactly 60', () => {
      const { container } = render(<ProgressBar percentage={60} />);
      const inner = container.querySelector('div > div > div');
      expect(inner).toHaveClass('bg-amber-400');
      expect(inner).not.toHaveClass('bg-emerald-500');
      expect(inner).not.toHaveClass('bg-red-500');
    });

    it('renders amber bar when percentage is between 60 and 85', () => {
      const { container } = render(<ProgressBar percentage={75} />);
      const inner = container.querySelector('div > div > div');
      expect(inner).toHaveClass('bg-amber-400');
    });

    it('renders amber bar when percentage is just below 85', () => {
      const { container } = render(<ProgressBar percentage={84} />);
      const inner = container.querySelector('div > div > div');
      expect(inner).toHaveClass('bg-amber-400');
    });

    it('renders red bar when percentage is exactly 85', () => {
      const { container } = render(<ProgressBar percentage={85} />);
      const inner = container.querySelector('div > div > div');
      expect(inner).toHaveClass('bg-red-500');
      expect(inner).not.toHaveClass('bg-amber-400');
      expect(inner).not.toHaveClass('bg-emerald-500');
    });

    it('renders red bar when percentage is above 85', () => {
      const { container } = render(<ProgressBar percentage={95} />);
      const inner = container.querySelector('div > div > div');
      expect(inner).toHaveClass('bg-red-500');
    });

    it('renders red bar when percentage is exactly 100', () => {
      const { container } = render(<ProgressBar percentage={100} />);
      const inner = container.querySelector('div > div > div');
      expect(inner).toHaveClass('bg-red-500');
    });
  });

  describe('width calculation', () => {
    it('sets width to 30% for percentage 30', () => {
      const { container } = render(<ProgressBar percentage={30} />);
      const inner = container.querySelector('div > div > div') as HTMLElement;
      expect(inner.style.width).toBe('30%');
    });

    it('sets width to 0% for percentage 0', () => {
      const { container } = render(<ProgressBar percentage={0} />);
      const inner = container.querySelector('div > div > div') as HTMLElement;
      expect(inner.style.width).toBe('0%');
    });

    it('sets width to 60% for percentage 60', () => {
      const { container } = render(<ProgressBar percentage={60} />);
      const inner = container.querySelector('div > div > div') as HTMLElement;
      expect(inner.style.width).toBe('60%');
    });

    it('sets width to 85% for percentage 85', () => {
      const { container } = render(<ProgressBar percentage={85} />);
      const inner = container.querySelector('div > div > div') as HTMLElement;
      expect(inner.style.width).toBe('85%');
    });

    it('sets width to 100% for percentage 100', () => {
      const { container } = render(<ProgressBar percentage={100} />);
      const inner = container.querySelector('div > div > div') as HTMLElement;
      expect(inner.style.width).toBe('100%');
    });

    it('clamps width to 100% when percentage exceeds 100', () => {
      const { container } = render(<ProgressBar percentage={150} />);
      const inner = container.querySelector('div > div > div') as HTMLElement;
      expect(inner.style.width).toBe('100%');
    });

    it('clamps width to 100% when percentage is very large', () => {
      const { container } = render(<ProgressBar percentage={999} />);
      const inner = container.querySelector('div > div > div') as HTMLElement;
      expect(inner.style.width).toBe('100%');
    });
  });

  describe('structure and styling', () => {
    it('renders a track container with correct classes', () => {
      const { container } = render(<ProgressBar percentage={50} />);
      const outer = container.querySelector('div');
      expect(outer).toHaveClass('bg-gray-700');
      expect(outer).toHaveClass('rounded-full');
      expect(outer).toHaveClass('h-2');
      expect(outer).toHaveClass('w-full');
    });

    it('renders an inner filled bar with rounded-full and h-2', () => {
      const { container } = render(<ProgressBar percentage={50} />);
      const inner = container.querySelector('div > div > div');
      expect(inner).toHaveClass('rounded-full');
      expect(inner).toHaveClass('h-2');
    });

    it('renders exactly one outer and one inner div', () => {
      const { container } = render(<ProgressBar percentage={50} />);
      const allDivs = container.querySelectorAll('div');
      expect(allDivs).toHaveLength(2);
    });
  });

  describe('edge cases with clamping and color', () => {
    it('uses clamped width but original percentage for color when over 100', () => {
      // percentage > 100 is >= 85 so should be red, width clamped to 100%
      const { container } = render(<ProgressBar percentage={150} />);
      const inner = container.querySelector('div > div > div') as HTMLElement;
      expect(inner).toHaveClass('bg-red-500');
      expect(inner.style.width).toBe('100%');
    });

    it('handles negative percentage gracefully', () => {
      // negative percentage: < 60 so emerald; Math.min(-50, 100) = -50 => "-50%" is
      // invalid CSS, so jsdom drops it and style.width is empty
      const { container } = render(<ProgressBar percentage={-50} />);
      const inner = container.querySelector('div > div > div') as HTMLElement;
      expect(inner).toHaveClass('bg-emerald-500');
      // jsdom ignores invalid negative width values
      expect(inner.style.width).toBe('');
    });

    it('renders correctly at the exact midpoint of amber range (72)', () => {
      const { container } = render(<ProgressBar percentage={72} />);
      const inner = container.querySelector('div > div > div') as HTMLElement;
      expect(inner).toHaveClass('bg-amber-400');
      expect(inner.style.width).toBe('72%');
    });
  });
});
