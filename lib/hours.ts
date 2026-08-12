/** Google Places day index: 0 = Sunday … 6 = Saturday */
export const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type DayName = (typeof DAY_NAMES)[number];

export type DayHours = {
  open: string;
  close: string;
  closed?: boolean;
};

export type BusinessHours = {
  [day: string]: DayHours;
};

export type GoogleOpeningPeriod = {
  open?: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
};

export type GoogleOpeningHours = {
  periods?: GoogleOpeningPeriod[];
};

const ALL_DAY: DayHours = { open: '00:00', close: '23:59' };
const CLOSED: DayHours = { open: '', close: '', closed: true };

function fmtTime(t: { hour: number; minute: number }): string {
  return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
}

function allDaysOpen(): BusinessHours {
  const out: BusinessHours = {};
  for (const day of DAY_NAMES) out[day] = { ...ALL_DAY };
  return out;
}

/**
 * Google Places encodes always-open (24/7) as a single period with
 * `open` at day/hour/minute 0 and no `close` field.
 * See: https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places#OpeningHours
 */
export function isGoogleAlwaysOpen(periods: GoogleOpeningPeriod[]): boolean {
  return periods.some((p) => Boolean(p.open) && !p.close);
}

/** True when a day is stored as a full 24-hour window. */
export function isOpen24Hours(dayHours: DayHours | undefined): boolean {
  if (!dayHours || dayHours.closed) return false;
  const { open, close } = dayHours;
  return (
    (open === '00:00' && close === '23:59') ||
    (open === '00:00' && close === '00:00') ||
    (open === '00:00' && close === '24:00')
  );
}

/**
 * Detect the buggy import shape: only Sunday 00:00–23:59, every other day closed.
 * That was produced when 24/7 Places periods were mapped day-by-day.
 */
export function isMisencodedAlwaysOpen(hours: BusinessHours | undefined): boolean {
  if (!hours) return false;
  const sunday = hours.sunday;
  if (!sunday || sunday.closed || !isOpen24Hours(sunday)) return false;
  return DAY_NAMES.filter((d) => d !== 'sunday').every((day) => {
    const h = hours[day];
    return !h || Boolean(h.closed);
  });
}

/** Repair already-imported hours that used the Sunday-only 24/7 shape. */
export function fixMisencodedHours(hours: BusinessHours | undefined): BusinessHours | undefined {
  if (!hours) return hours;
  if (isMisencodedAlwaysOpen(hours)) return allDaysOpen();

  const out: BusinessHours = { ...hours };
  for (const day of DAY_NAMES) {
    const h = out[day];
    if (h && !h.closed && h.open === '00:00' && h.close === '00:00') {
      out[day] = { ...ALL_DAY };
    }
  }
  return out;
}

/**
 * Map Google Places `regularOpeningHours.periods` into our day-keyed hours object.
 */
export function mapGoogleOpeningHours(
  hours?: GoogleOpeningHours,
): BusinessHours | undefined {
  if (!hours?.periods?.length) return undefined;

  // Always open 24/7 — close is omitted (often a single Sunday 00:00 open).
  if (isGoogleAlwaysOpen(hours.periods)) {
    return allDaysOpen();
  }

  const out: BusinessHours = {};
  for (const p of hours.periods) {
    if (!p.open || p.open.day < 0 || p.open.day > 6) continue;
    const day = DAY_NAMES[p.open.day];

    // Open midnight → close next midnight = open all day that day.
    if (
      p.close &&
      p.open.hour === 0 &&
      p.open.minute === 0 &&
      p.close.hour === 0 &&
      p.close.minute === 0 &&
      p.close.day === (p.open.day + 1) % 7
    ) {
      out[day] = { ...ALL_DAY };
      continue;
    }

    out[day] = p.close
      ? { open: fmtTime(p.open), close: fmtTime(p.close) }
      : { ...ALL_DAY };
  }

  for (const day of DAY_NAMES) {
    if (!out[day]) out[day] = { ...CLOSED };
  }
  return out;
}

export function formatDayHoursLabel(dayHours: DayHours): string {
  if (dayHours.closed) return 'Closed';
  if (isOpen24Hours(dayHours)) return 'Open 24 hours';
  return `${dayHours.open} – ${dayHours.close}`;
}
