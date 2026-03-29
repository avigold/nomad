export interface CountryStatus {
  country: string;
  name: string;
  flag: string;
  daysPresent: number;
  threshold: number;
  window: number;
  daysRemaining: number;
  percentage: number;
  windowStart: string;
  windowEnd: string;
  isDefaultRule: boolean;
}

export interface DateWindow {
  start: string;
  end: string;
}