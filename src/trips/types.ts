import type { Trip } from "../db/types";

export type TripFormValues = {
  country: string;
  arrival: string;
  departure: string;
};

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

export type ExportPayload = {
  version: number;
  exportedAt: string;
  trips: Trip[];
};