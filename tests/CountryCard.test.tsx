import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { CountryCard } from '../src/dashboard/CountryCard';
import type { CountryStatus } from '../src/calculations/types';

vi.mock('../src/dashboard/ProgressBar', () => ({
  ProgressBar: ({ percentage }: { percentage: number }) => (
    <div data-testid="progress-bar" data-percentage={percentage} />
  ),
}));

function makeStatus(overrides: Partial<CountryStatus> = {}): CountryStatus {
  return {
    country: 'FR',
    name: 'France',
    flag: '\u{1F1EB}\u{1F1F7}',
    daysPresent: 45,
    threshold: 90,
    window: 365,
    percentage: 50,
    daysRemaining: 45,
    windowStart: '2024-01-01',
    windowEnd: '2024-06-30',
    isDefaultRule: false,
    ...overrides,
  };
}

describe('CountryCard', () => {
  describe('flag and country name rendering', () => {
    it('renders the flag emoji', () => {
      render(<CountryCard status={makeStatus()} />);
      expect(screen.getByText(/\u{1F1EB}\u{1F1F7}/u)).toBeInTheDocument();
    });

    it('renders the country name', () => {
      render(<CountryCard status={makeStatus()} />);
      expect(screen.getByText(/France/)).toBeInTheDocument();
    });

    it('renders country name with white text when isDefaultRule is false', () => {
      render(<CountryCard status={makeStatus({ isDefaultRule: false })} />);
      const nameEl = screen.getByText(/\u{1F1EB}\u{1F1F7} France/u);
      expect(nameEl).toHaveClass('text-white');
      expect(nameEl).not.toHaveClass('text-gray-500');
    });

    it('renders country name with muted text when isDefaultRule is true', () => {
      render(<CountryCard status={makeStatus({ isDefaultRule: true })} />);
      const nameEl = screen.getByText(/\u{1F1EB}\u{1F1F7} France/u);
      expect(nameEl).toHaveClass('text-gray-500');
      expect(nameEl).not.toHaveClass('text-white');
    });

    it('renders a different country name correctly', () => {
      render(
        <CountryCard
          status={makeStatus({ country: 'DE', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' })}
        />
      );
      expect(screen.getByText(/\u{1F1E9}\u{1F1EA} Germany/u)).toBeInTheDocument();
    });
  });

  describe('days used / max days label', () => {
    it('renders the days used and max days', () => {
      render(<CountryCard status={makeStatus({ daysPresent: 45, threshold: 90 })} />);
      expect(screen.getByText('45 / 90 days')).toBeInTheDocument();
    });

    it('renders zero days used', () => {
      render(<CountryCard status={makeStatus({ daysPresent: 0, threshold: 90 })} />);
      expect(screen.getByText('0 / 90 days')).toBeInTheDocument();
    });

    it('renders when days used equals max days', () => {
      render(<CountryCard status={makeStatus({ daysPresent: 90, threshold: 90 })} />);
      expect(screen.getByText('90 / 90 days')).toBeInTheDocument();
    });

    it('renders when days used exceeds max days', () => {
      render(<CountryCard status={makeStatus({ daysPresent: 95, threshold: 90 })} />);
      expect(screen.getByText('95 / 90 days')).toBeInTheDocument();
    });
  });

  describe('ProgressBar integration', () => {
    it('renders the ProgressBar component', () => {
      render(<CountryCard status={makeStatus()} />);
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('passes percentage to ProgressBar', () => {
      render(<CountryCard status={makeStatus({ percentage: 75 })} />);
      expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-percentage', '75');
    });

    it('passes zero percentage to ProgressBar', () => {
      render(<CountryCard status={makeStatus({ percentage: 0 })} />);
      expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-percentage', '0');
    });

    it('passes 100 percentage to ProgressBar', () => {
      render(<CountryCard status={makeStatus({ percentage: 100 })} />);
      expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-percentage', '100');
    });
  });

  describe('days remaining text', () => {
    it('shows days remaining text when daysRemaining is positive', () => {
      render(<CountryCard status={makeStatus({ daysRemaining: 45 })} />);
      expect(screen.getByText('45 days remaining')).toBeInTheDocument();
    });

    it('shows days remaining text with gray color when positive', () => {
      render(<CountryCard status={makeStatus({ daysRemaining: 45 })} />);
      const el = screen.getByText('45 days remaining');
      expect(el).toHaveClass('text-gray-300');
    });

    it('shows days remaining text when daysRemaining is zero', () => {
      render(<CountryCard status={makeStatus({ daysRemaining: 0 })} />);
      expect(screen.getByText('0 days remaining')).toBeInTheDocument();
    });

    it('does not show exceeded text when daysRemaining is zero', () => {
      render(<CountryCard status={makeStatus({ daysRemaining: 0 })} />);
      expect(screen.queryByText(/EXCEEDED/)).not.toBeInTheDocument();
    });

    it('shows exceeded text when daysRemaining is negative', () => {
      render(<CountryCard status={makeStatus({ daysRemaining: -5 })} />);
      expect(screen.getByText('EXCEEDED by 5 days')).toBeInTheDocument();
    });

    it('shows exceeded text with red color when negative', () => {
      render(<CountryCard status={makeStatus({ daysRemaining: -5 })} />);
      const el = screen.getByText('EXCEEDED by 5 days');
      expect(el).toHaveClass('text-red-400');
    });

    it('does not show remaining text when daysRemaining is negative', () => {
      render(<CountryCard status={makeStatus({ daysRemaining: -5 })} />);
      expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
    });

    it('shows correct absolute value for large negative daysRemaining', () => {
      render(<CountryCard status={makeStatus({ daysRemaining: -30 })} />);
      expect(screen.getByText('EXCEEDED by 30 days')).toBeInTheDocument();
    });

    it('shows 1 day remaining', () => {
      render(<CountryCard status={makeStatus({ daysRemaining: 1 })} />);
      expect(screen.getByText('1 days remaining')).toBeInTheDocument();
    });

    it('shows 1 day exceeded', () => {
      render(<CountryCard status={makeStatus({ daysRemaining: -1 })} />);
      expect(screen.getByText('EXCEEDED by 1 days')).toBeInTheDocument();
    });
  });

  describe('date range rendering', () => {
    it('renders the formatted date range', () => {
      render(
        <CountryCard
          status={makeStatus({
            windowStart: '2024-01-01',
            windowEnd: '2024-06-30',
          })}
        />
      );
      expect(screen.getByText('Jan 1, 2024 \u2013 Jun 30, 2024')).toBeInTheDocument();
    });

    it('renders date range with same start and end date', () => {
      render(
        <CountryCard
          status={makeStatus({
            windowStart: '2024-03-15',
            windowEnd: '2024-03-15',
          })}
        />
      );
      expect(screen.getByText('Mar 15, 2024 \u2013 Mar 15, 2024')).toBeInTheDocument();
    });

    it('renders date range spanning different years', () => {
      render(
        <CountryCard
          status={makeStatus({
            windowStart: '2023-07-01',
            windowEnd: '2024-06-30',
          })}
        />
      );
      expect(screen.getByText('Jul 1, 2023 \u2013 Jun 30, 2024')).toBeInTheDocument();
    });

    it('renders date range with single-digit day', () => {
      render(
        <CountryCard
          status={makeStatus({
            windowStart: '2024-02-05',
            windowEnd: '2024-11-09',
          })}
        />
      );
      expect(screen.getByText('Feb 5, 2024 \u2013 Nov 9, 2024')).toBeInTheDocument();
    });

    it('renders date range with muted gray color', () => {
      render(
        <CountryCard
          status={makeStatus({
            windowStart: '2024-01-01',
            windowEnd: '2024-06-30',
          })}
        />
      );
      const dateEl = screen.getByText('Jan 1, 2024 \u2013 Jun 30, 2024');
      expect(dateEl).toHaveClass('text-gray-500');
    });
  });

  describe('overall card structure', () => {
    it('renders a card container with expected classes', () => {
      const { container } = render(<CountryCard status={makeStatus()} />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-gray-900');
      expect(card).toHaveClass('rounded-lg');
    });

    it('renders all major sections together', () => {
      render(
        <CountryCard
          status={makeStatus({
            country: 'ES',
            name: 'Spain',
            flag: '\u{1F1EA}\u{1F1F8}',
            daysPresent: 30,
            threshold: 90,
            percentage: 33,
            daysRemaining: 60,
            windowStart: '2024-01-01',
            windowEnd: '2024-12-31',
          })}
        />
      );

      expect(screen.getByText(/\u{1F1EA}\u{1F1F8} Spain/u)).toBeInTheDocument();
      expect(screen.getByText('30 / 90 days')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
      expect(screen.getByText('60 days remaining')).toBeInTheDocument();
      expect(screen.getByText('Jan 1, 2024 \u2013 Dec 31, 2024')).toBeInTheDocument();
    });

    it('renders correctly with isDefaultRule true and exceeded days', () => {
      render(
        <CountryCard
          status={makeStatus({
            country: 'IT',
            name: 'Italy',
            flag: '\u{1F1EE}\u{1F1F9}',
            daysPresent: 100,
            threshold: 90,
            percentage: 111,
            daysRemaining: -10,
            isDefaultRule: true,
          })}
        />
      );

      const nameEl = screen.getByText(/\u{1F1EE}\u{1F1F9} Italy/u);
      expect(nameEl).toHaveClass('text-gray-500');
      expect(screen.getByText('100 / 90 days')).toBeInTheDocument();
      expect(screen.getByText('EXCEEDED by 10 days')).toBeInTheDocument();
    });
  });
});
