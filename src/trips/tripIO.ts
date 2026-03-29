import type { Trip } from "../db/types";
import type { ExportPayload } from "./types";

export function buildExportFilename(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `trips-export-${yyyy}-${mm}-${dd}.json`;
}

export function exportTripsToJSON(trips: Trip[]): void {
  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    trips,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildExportFilename();
  anchor.click();

  URL.revokeObjectURL(url);
}

export function parseImportFile(raw: string): { trips: Trip[]; error?: string } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { trips: [], error: "Invalid JSON file." };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { trips: [], error: "Invalid file format: expected a JSON object." };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.version !== 1) {
    return { trips: [], error: `Unsupported export version: ${obj.version}.` };
  }

  if (!Array.isArray(obj.trips)) {
    return { trips: [], error: "Invalid file format: trips must be an array." };
  }

  const trips: Trip[] = [];

  for (let i = 0; i < obj.trips.length; i++) {
    const item = obj.trips[i];

    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return { trips: [], error: `Trip at index ${i} is not a valid object.` };
    }

    const t = item as Record<string, unknown>;

    if (typeof t.id !== "string" || t.id.trim() === "") {
      return { trips: [], error: `Trip at index ${i} is missing a valid id.` };
    }

    if (typeof t.country !== "string" || t.country.trim() === "") {
      return { trips: [], error: `Trip at index ${i} is missing a valid country.` };
    }

    if (typeof t.arrival !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(t.arrival)) {
      return { trips: [], error: `Trip at index ${i} has an invalid arrival date.` };
    }

    if (typeof t.departure !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(t.departure)) {
      return { trips: [], error: `Trip at index ${i} has an invalid departure date.` };
    }

    if (t.departure < t.arrival) {
      return {
        trips: [],
        error: `Trip at index ${i} has a departure date before its arrival date.`,
      };
    }

    trips.push({
      id: t.id,
      country: t.country,
      arrival: t.arrival,
      departure: t.departure,
    });
  }

  return { trips };
}