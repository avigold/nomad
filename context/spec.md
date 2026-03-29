---
title: Nomad
type: spec
has_ui: true
features:
  - Dashboard with per-country day counts and color-coded progress bars
  - Trip logging with overlap validation and inline editing
  - Configurable per-country residency threshold rules
  - Rolling window calculation engine (inclusive day counting)
  - JSON export and import for trip data backup
  - IndexedDB persistence via Dexie with reactive live queries
---

# Nomad — Residency Day Tracker

## Purpose

A local-first single-page application for digital nomads and frequent travellers who need to track how many days they have spent in each country within a rolling time window. The primary goal is to prevent accidentally triggering de facto tax residency by exceeding a country's day-count threshold.

## Core Concept

Many countries define tax residency as spending more than N days within a rolling M-day window (commonly 183 days in a 365-day window, but thresholds vary). The user logs their trips (country + date range), and the app continuously calculates their day counts and warns them when they are approaching or have exceeded a threshold.

## Data Model

### Trip

A trip represents a contiguous stay in one country.

```
Trip {
  id: string              // UUID
  country: string         // ISO 3166-1 alpha-2 code (e.g. "PT", "US", "TH")
  arrival: string         // ISO date "YYYY-MM-DD"
  departure: string|null  // ISO date "YYYY-MM-DD", null means "still there"
}
```

Rules:
- `arrival` is required and must be a valid date.
- `departure` is null if the trip is ongoing, otherwise must be >= `arrival`.
- Both arrival and departure dates count as days present (inclusive on both ends).
- Trips must not overlap. The app should validate this on save and show an error if the new trip overlaps an existing one.
- A trip with `departure === null` is the "current trip". There can be at most one current trip at a time.

### Country Rule

Configurable per-country thresholds.

```
CountryRule {
  country: string    // ISO 3166-1 alpha-2
  name: string       // Display name (e.g. "Portugal")
  threshold: number  // Max days allowed before residency triggers
  window: number     // Rolling window in days (e.g. 365)
}
```

The app ships with sensible defaults for ~10 common countries (see below). The user can add, edit, or delete rules.

### Default Country Rules

| Country | Code | Threshold | Window |
|---------|------|-----------|--------|
| United States | US | 183 | 365 |
| United Kingdom | GB | 183 | 365 |
| Portugal | PT | 183 | 365 |
| Spain | ES | 183 | 365 |
| France | FR | 183 | 365 |
| Germany | DE | 183 | 365 |
| Thailand | TH | 180 | 365 |
| Canada | CA | 183 | 365 |
| Australia | AU | 183 | 365 |
| Japan | JP | 183 | 365 |
| Netherlands | NL | 183 | 365 |
| Italy | IT | 183 | 365 |

## Calculation Logic

For a given country on a given reference date (default: today):

1. Compute the rolling window: `[referenceDate - rule.window + 1, referenceDate]`.
2. Find all trips for that country.
3. For each trip, compute the overlap between the trip's date range and the rolling window.
4. Sum the overlapping days across all trips. This is `daysPresent`.
5. `daysRemaining = rule.threshold - daysPresent` (can be negative if exceeded).
6. `percentage = daysPresent / rule.threshold` (capped at 1.0 for display).

For the "still there" trip (departure is null), treat today as the departure date for calculation purposes.

## Views

The app has a single-page layout with a top navigation bar and three views, switched by the nav bar:

### 1. Dashboard (default view)

The dashboard is the primary view. It shows a card for every country the user has visited (i.e. has at least one trip) OR has a configured rule for.

Each country card displays:
- Country flag emoji + country name
- Days present / threshold (e.g. "47 / 183")
- A horizontal progress bar:
  - **Green** (0–59% of threshold)
  - **Amber** (60–84% of threshold)
  - **Red** (85%+ of threshold)
- Days remaining text (e.g. "136 days remaining" or "EXCEEDED by 4 days" in red)
- The rolling window dates (e.g. "Apr 1, 2025 – Mar 29, 2026")

Cards are sorted: exceeded first (red), then by percentage descending.

If the user has no trips, show an empty state: "No trips logged yet. Add your first trip to start tracking."

### 2. Trips

A chronological list of all trips, most recent first.

Each trip row shows:
- Country flag emoji + country name
- Date range (e.g. "Jan 15 – Feb 3, 2026") or "Jan 15, 2026 – present" for ongoing trips
- Duration in days (e.g. "20 days")
- Edit and Delete buttons

Above the list: an "Add Trip" button that opens an inline form (not a modal) at the top of the list.

**Add/Edit Trip Form:**
- Country: searchable dropdown/select. Show flag emoji + name. When adding, default to the country of the most recent trip.
- Arrival date: date picker. Required.
- Departure date: date picker. Optional — leave blank for "ongoing/still here".
- Save and Cancel buttons.
- Validate: no overlapping trips, arrival <= departure if departure set.
- On validation error, show the error inline below the form in red text.

### 3. Rules

A table of country rules showing: Country (flag + name), Threshold, Window, and action buttons (Edit, Delete).

"Add Rule" button at top opens inline form:
- Country: searchable dropdown (exclude countries that already have rules).
- Threshold: number input (default 183).
- Window: number input (default 365).
- Save / Cancel buttons.

## Behaviour Details

- All dates are calendar dates (no time zones). The app works in the user's local date context.
- "Today" means `new Date()` formatted as YYYY-MM-DD in the user's local timezone.
- Day counting is inclusive on both ends: a trip from Jan 1 to Jan 3 = 3 days.
- The progress bar percentage is `Math.min(daysPresent / threshold, 1.0)`.
- Countries without a configured rule should still appear on the dashboard if the user has trips there, but with a default 183/365 rule shown in grey/muted to indicate it's a default.
- Data persists across page reloads via IndexedDB (see tech-stack.md).
- No authentication, no backend, no network requests.

## Export / Import

On the Trips view, provide "Export JSON" and "Import JSON" buttons:
- Export: downloads all trips as a JSON file (`nomad-trips-YYYY-MM-DD.json`).
- Import: reads a JSON file and replaces all current trips after confirmation ("This will replace all existing trips. Continue?").

## Non-Goals

- No multi-user support.
- No visa tracking or expiry dates.
- No flight/travel booking integration.
- No mobile-native app (responsive web is fine).
- No server-side component.
- No complex timezone handling.
