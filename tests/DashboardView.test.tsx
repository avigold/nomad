import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardView } from '../src/dashboard/DashboardView';
import type { CountryStatus } from '../src/calculations/types';

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

// Mock db
vi.mock('../src/db/database', () => ({
  db: {
    trips: { toArray: vi.fn() },
    rules: { toArray: vi.fn() },
  },
}));

// Mock computeCountryStatus
vi.mock('../src/calculations/engine', () => ({
  computeCountryStatus: vi.fn(),
}));

// Mock CountryCard
vi.mock('../src/dashboard/CountryCard', () => ({
  CountryCard: ({ status }: { status: CountryStatus }) => (
    <div data-testid="country-card" data-country={status.country}>
      {status.country}
    </div>
  ),
}));

// Mock EmptyState
vi.mock('../src/dashboard/EmptyState', () => ({
  EmptyState: () => <div data-testid="empty-state">No trips yet</div>,
}));

import { useLiveQuery } from 'dexie-react-hooks';
import { computeCountryStatus } from '../src/calculations/engine';

const mockUseLiveQuery = vi.mocked(useLiveQuery);
const mockComputeCountryStatus = vi.mocked(computeCountryStatus);

function makeStatus(country: string, overrides: Partial<CountryStatus> = {}): CountryStatus {
  return {
    country,
    name: country,
    flag: '',
    daysPresent: 10,
    threshold: 90,
    window: 365,
    daysRemaining: 80,
    percentage: 11,
    windowStart: '2024-01-01',
    windowEnd: '2024-12-31',
    isDefaultRule: true,
    ...overrides,
  };
}

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading indicator when trips are undefined', () => {
      mockUseLiveQuery
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce([]);

      render(<DashboardView />);

      expect(screen.getByText(/Loading/)).toBeInTheDocument();
    });

    it('shows loading indicator when rules are undefined', () => {
      mockUseLiveQuery
        .mockReturnValueOnce([])
        .mockReturnValueOnce(undefined);

      render(<DashboardView />);

      expect(screen.getByText(/Loading/)).toBeInTheDocument();
    });

    it('shows loading indicator when both trips and rules are undefined', () => {
      mockUseLiveQuery
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined);

      render(<DashboardView />);

      expect(screen.getByText(/Loading/)).toBeInTheDocument();
    });

    it('does not render EmptyState or CountryCards while loading', () => {
      mockUseLiveQuery
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined);

      render(<DashboardView />);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('country-card')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('renders EmptyState when there are no trips', () => {
      mockUseLiveQuery
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      render(<DashboardView />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('renders EmptyState when trips array is empty even if rules exist', () => {
      mockUseLiveQuery
        .mockReturnValueOnce([])
        .mockReturnValueOnce([{ country: 'FR', name: 'France', threshold: 90, window: 180 }]);

      render(<DashboardView />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('does not render CountryCards in empty state', () => {
      mockUseLiveQuery
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      render(<DashboardView />);

      expect(screen.queryByTestId('country-card')).not.toBeInTheDocument();
    });
  });

  describe('Happy path - rendering country cards', () => {
    it('renders a CountryCard for each country with trips', () => {
      const trips = [
        { id: '1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
        { id: '2', country: 'DE', arrival: '2024-02-01', departure: '2024-02-10' },
      ];
      const rules: never[] = [];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce(rules);

      mockComputeCountryStatus.mockImplementation((country) =>
        makeStatus(country as string)
      );

      render(<DashboardView />);

      const cards = screen.getAllByTestId('country-card');
      expect(cards).toHaveLength(2);
    });

    it('renders a CountryCard for countries with rules but no trips', () => {
      const trips = [
        { id: '1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
      ];
      const rules = [
        { country: 'DE', name: 'Germany', threshold: 90, window: 180 },
      ];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce(rules);

      mockComputeCountryStatus.mockImplementation((country) =>
        makeStatus(country as string)
      );

      render(<DashboardView />);

      const cards = screen.getAllByTestId('country-card');
      expect(cards).toHaveLength(2);

      const countries = cards.map((c) => c.getAttribute('data-country'));
      expect(countries).toContain('FR');
      expect(countries).toContain('DE');
    });

    it('deduplicates countries that appear in both trips and rules', () => {
      const trips = [
        { id: '1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
      ];
      const rules = [
        { country: 'FR', name: 'France', threshold: 90, window: 180 },
      ];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce(rules);

      mockComputeCountryStatus.mockImplementation((country) =>
        makeStatus(country as string)
      );

      render(<DashboardView />);

      const cards = screen.getAllByTestId('country-card');
      expect(cards).toHaveLength(1);
      expect(mockComputeCountryStatus).toHaveBeenCalledTimes(1);
    });

    it('passes correct country and rule to computeCountryStatus', () => {
      const trips = [
        { id: '1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
      ];
      const rules = [
        { country: 'FR', name: 'France', threshold: 90, window: 180 },
      ];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce(rules);

      mockComputeCountryStatus.mockReturnValue(makeStatus('FR'));

      render(<DashboardView />);

      // computeCountryStatus(country, trips, rule|null)
      expect(mockComputeCountryStatus).toHaveBeenCalledWith(
        'FR',
        trips,
        { country: 'FR', name: 'France', threshold: 90, window: 180 }
      );
    });

    it('passes null as rule when country has no rule', () => {
      const trips = [
        { id: '1', country: 'JP', arrival: '2024-01-01', departure: '2024-01-10' },
      ];
      const rules: never[] = [];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce(rules);

      mockComputeCountryStatus.mockReturnValue(makeStatus('JP'));

      render(<DashboardView />);

      expect(mockComputeCountryStatus).toHaveBeenCalledWith('JP', trips, null);
    });
  });

  describe('Sorting behaviour', () => {
    it('sorts exceeded countries (daysRemaining < 0) before non-exceeded', () => {
      const trips = [
        { id: '1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
        { id: '2', country: 'DE', arrival: '2024-02-01', departure: '2024-02-10' },
        { id: '3', country: 'ES', arrival: '2024-03-01', departure: '2024-03-10' },
      ];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce([]);

      mockComputeCountryStatus.mockImplementation((country) => {
        if (country === 'FR') return makeStatus('FR', { daysRemaining: -10, percentage: 111 });
        if (country === 'DE') return makeStatus('DE', { daysRemaining: 40, percentage: 56 });
        return makeStatus('ES', { daysRemaining: 70, percentage: 22 });
      });

      render(<DashboardView />);

      const cards = screen.getAllByTestId('country-card');
      expect(cards[0].getAttribute('data-country')).toBe('FR');
    });

    it('sorts non-exceeded countries by percentage descending', () => {
      const trips = [
        { id: '1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
        { id: '2', country: 'DE', arrival: '2024-02-01', departure: '2024-02-10' },
        { id: '3', country: 'ES', arrival: '2024-03-01', departure: '2024-03-10' },
      ];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce([]);

      mockComputeCountryStatus.mockImplementation((country) => {
        if (country === 'FR') return makeStatus('FR', { daysRemaining: 70, percentage: 22 });
        if (country === 'DE') return makeStatus('DE', { daysRemaining: 10, percentage: 89 });
        return makeStatus('ES', { daysRemaining: 40, percentage: 56 });
      });

      render(<DashboardView />);

      const cards = screen.getAllByTestId('country-card');
      const countries = cards.map((c) => c.getAttribute('data-country'));
      expect(countries).toEqual(['DE', 'ES', 'FR']);
    });

    it('places multiple exceeded countries before all non-exceeded countries', () => {
      const trips = [
        { id: '1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
        { id: '2', country: 'DE', arrival: '2024-02-01', departure: '2024-02-10' },
        { id: '3', country: 'ES', arrival: '2024-03-01', departure: '2024-03-10' },
        { id: '4', country: 'IT', arrival: '2024-04-01', departure: '2024-04-10' },
      ];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce([]);

      mockComputeCountryStatus.mockImplementation((country) => {
        if (country === 'FR') return makeStatus('FR', { daysRemaining: -5, percentage: 106 });
        if (country === 'DE') return makeStatus('DE', { daysRemaining: 40, percentage: 56 });
        if (country === 'ES') return makeStatus('ES', { daysRemaining: -20, percentage: 122 });
        return makeStatus('IT', { daysRemaining: 70, percentage: 22 });
      });

      render(<DashboardView />);

      const cards = screen.getAllByTestId('country-card');
      const countries = cards.map((c) => c.getAttribute('data-country'));

      const frIndex = countries.indexOf('FR');
      const esIndex = countries.indexOf('ES');
      const deIndex = countries.indexOf('DE');
      const itIndex = countries.indexOf('IT');

      expect(frIndex).toBeLessThan(deIndex);
      expect(frIndex).toBeLessThan(itIndex);
      expect(esIndex).toBeLessThan(deIndex);
      expect(esIndex).toBeLessThan(itIndex);
    });

    it('sorts exceeded countries among themselves by percentage descending', () => {
      const trips = [
        { id: '1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
        { id: '2', country: 'DE', arrival: '2024-02-01', departure: '2024-02-10' },
      ];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce([]);

      mockComputeCountryStatus.mockImplementation((country) => {
        if (country === 'FR') return makeStatus('FR', { daysRemaining: -5, percentage: 106 });
        return makeStatus('DE', { daysRemaining: -20, percentage: 122 });
      });

      render(<DashboardView />);

      const cards = screen.getAllByTestId('country-card');
      const countries = cards.map((c) => c.getAttribute('data-country'));

      expect(countries[0]).toBe('DE');
      expect(countries[1]).toBe('FR');
    });

    it('renders a single country card when only one country exists', () => {
      const trips = [
        { id: '1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
      ];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce([]);

      mockComputeCountryStatus.mockReturnValue(makeStatus('FR'));

      render(<DashboardView />);

      const cards = screen.getAllByTestId('country-card');
      expect(cards).toHaveLength(1);
      expect(cards[0].getAttribute('data-country')).toBe('FR');
    });
  });

  describe('Country union logic', () => {
    it('includes countries from trips that have no rules', () => {
      const trips = [
        { id: '1', country: 'JP', arrival: '2024-01-01', departure: '2024-01-10' },
      ];
      const rules: never[] = [];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce(rules);

      mockComputeCountryStatus.mockReturnValue(makeStatus('JP'));

      render(<DashboardView />);

      expect(mockComputeCountryStatus).toHaveBeenCalledWith('JP', trips, null);
    });

    it('includes countries from rules that have no trips', () => {
      const trips = [
        { id: '1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
      ];
      const rules = [
        { country: 'AU', name: 'Australia', threshold: 90, window: 180 },
      ];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce(rules);

      mockComputeCountryStatus.mockImplementation((country) =>
        makeStatus(country as string)
      );

      render(<DashboardView />);

      const calledCountries = mockComputeCountryStatus.mock.calls.map((c) => c[0]);
      expect(calledCountries).toContain('AU');
    });

    it('handles multiple trips to the same country without duplicating the card', () => {
      const trips = [
        { id: '1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
        { id: '2', country: 'FR', arrival: '2024-03-01', departure: '2024-03-15' },
      ];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce([]);

      mockComputeCountryStatus.mockReturnValue(makeStatus('FR'));

      render(<DashboardView />);

      const cards = screen.getAllByTestId('country-card');
      expect(cards).toHaveLength(1);
      expect(mockComputeCountryStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Layout', () => {
    it('renders cards inside a grid container', () => {
      const trips = [
        { id: '1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
      ];

      mockUseLiveQuery
        .mockReturnValueOnce(trips)
        .mockReturnValueOnce([]);

      mockComputeCountryStatus.mockReturnValue(makeStatus('FR'));

      const { container } = render(<DashboardView />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('grid');
      expect(wrapper).toHaveClass('gap-4');
    });
  });
});
