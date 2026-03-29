export interface CountryMeta {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRY_META: Record<string, CountryMeta> = {
  US: { code: 'US', name: 'United States', flag: '🇺🇸' },
  GB: { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  PT: { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  ES: { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  FR: { code: 'FR', name: 'France', flag: '🇫🇷' },
  DE: { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  TH: { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  CA: { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  AU: { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  JP: { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  NL: { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  IT: { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  AT: { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  BE: { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  CH: { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  CZ: { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  DK: { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  FI: { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  GR: { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  HR: { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  HU: { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  IE: { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  MX: { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  NO: { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  NZ: { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  PL: { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  RO: { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  SE: { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  SG: { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  SK: { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  TR: { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  UA: { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  VN: { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  ZA: { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  BR: { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  AR: { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  CO: { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  IN: { code: 'IN', name: 'India', flag: '🇮🇳' },
  CN: { code: 'CN', name: 'China', flag: '🇨🇳' },
  KR: { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  ID: { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  MY: { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  PH: { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  EG: { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  MA: { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  NG: { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  KE: { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  IL: { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  AE: { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  SA: { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
};

export const DEFAULT_COUNTRY_RULES: Array<{
  country: string;
  name: string;
  threshold: number;
  window: number;
}> = [
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

export function getCountryMeta(code: string): CountryMeta {
  return COUNTRY_META[code] ?? { code, name: code, flag: '🏳' };
}