export interface Trip {
  id: string;
  country: string;
  arrival: string;
  departure: string | null;
}

export interface CountryRule {
  country: string;
  name: string;
  threshold: number;
  window: number;
}