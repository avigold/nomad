import type { CountryRule } from './types';

export const DEFAULT_COUNTRY_RULES: ReadonlyArray<CountryRule> = [
  { country: 'US', name: 'United States', threshold: 183, window: 365 },
  { country: 'GB', name: 'United Kingdom', threshold: 183, window: 365 },
  { country: 'PT', name: 'Portugal', threshold: 183, window: 365 },
  { country: 'ES', name: 'Spain', threshold: 183, window: 365 },
  { country: 'FR', name: 'France', threshold: 183, window: 365 },
  { country: 'DE', name: 'Germany', threshold: 183, window: 365 },
  { country: 'TH', name: 'Thailand', threshold: 180, window: 365 },
  { country: 'CA', name: 'Canada', threshold: 183, window: 365 },
  { country: 'AU', name: 'Australia', threshold: 183, window: 365 },
  { country: 'JP', name: 'Japan', threshold: 183, window: 365 },
  { country: 'NL', name: 'Netherlands', threshold: 183, window: 365 },
  { country: 'IT', name: 'Italy', threshold: 183, window: 365 },
];