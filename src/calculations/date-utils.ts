import { format, parseISO } from 'date-fns';
import { differenceInDays } from 'date-fns';

const DATE_FORMAT = 'yyyy-MM-dd';

export function today(): string {
  return format(new Date(), DATE_FORMAT);
}

export function parseDate(dateStr: string): Date {
  return parseISO(dateStr);
}

export function formatDate(dateStr: string): string {
  return format(parseDate(dateStr), 'MMM d, yyyy');
}

export function formatDateShort(dateStr: string): string {
  return format(parseDate(dateStr), 'MMM d');
}

export function formatDateRange(arrival: string, departure: string | null): string {
  if (departure === null) {
    return `${formatDateShort(arrival)}, ${format(parseDate(arrival), 'yyyy')} – present`;
  }

  const arrivalDate = parseDate(arrival);
  const departureDate = parseDate(departure);

  const arrivalYear = format(arrivalDate, 'yyyy');
  const departureYear = format(departureDate, 'yyyy');

  if (arrivalYear === departureYear) {
    return `${formatDateShort(arrival)} – ${formatDate(departure)}`;
  }

  return `${formatDate(arrival)} – ${formatDate(departure)}`;
}

export function toDateStr(date: Date): string {
  return format(date, DATE_FORMAT);
}

export function tripDurationDays(arrival: string, departure: string | null): number {
  const end = departure ?? today();
  return differenceInDays(parseDate(end), parseDate(arrival)) + 1;
}