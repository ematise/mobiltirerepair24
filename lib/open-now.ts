import { DAY_NAMES, isOpen24Hours, type BusinessHours, type DayHours } from './hours';

export type OpenStatus = {
  openNow: boolean;
  /** Short human label, e.g. "Open 24 hours", "Open · closes 10:00 PM", "Closed · opens 8:00 AM" */
  label: string;
} | null;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Current { dayIndex (0=Sunday), minutes } in the given IANA timezone. */
function localNow(timeZone: string, now: Date): { dayIndex: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { dayIndex, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

export function getOpenStatus(
  hours: BusinessHours | undefined,
  timeZone: string,
  now: Date = new Date(),
): OpenStatus {
  if (!hours) return null;
  const { dayIndex, minutes } = localNow(timeZone, now);
  const today: DayHours | undefined = hours[DAY_NAMES[dayIndex]];
  const yesterday: DayHours | undefined = hours[DAY_NAMES[(dayIndex + 6) % 7]];

  // Spillover from yesterday's overnight window (e.g. open 20:00, close 04:00)
  if (yesterday && !yesterday.closed && !isOpen24Hours(yesterday)) {
    const yOpen = toMinutes(yesterday.open);
    const yClose = toMinutes(yesterday.close);
    if (yClose < yOpen && minutes < yClose) {
      return { openNow: true, label: `Open · closes ${to12h(yesterday.close)}` };
    }
  }

  if (today && !today.closed) {
    if (isOpen24Hours(today)) return { openNow: true, label: 'Open 24 hours' };
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    const inWindow = close < open ? minutes >= open : minutes >= open && minutes < close;
    if (inWindow) return { openNow: true, label: `Open · closes ${to12h(today.close)}` };
    if (minutes < open) return { openNow: false, label: `Closed · opens ${to12h(today.open)}` };
  }

  // Closed for the rest of today — find the next day with an opening
  for (let i = 1; i <= 7; i++) {
    const d = hours[DAY_NAMES[(dayIndex + i) % 7]];
    if (d && !d.closed) {
      const dayLabel =
        i === 1
          ? 'tomorrow'
          : DAY_NAMES[(dayIndex + i) % 7][0].toUpperCase() + DAY_NAMES[(dayIndex + i) % 7].slice(1);
      const openLabel = isOpen24Hours(d) ? '12 AM' : to12h(d.open);
      return { openNow: false, label: `Closed · opens ${openLabel} ${dayLabel}` };
    }
  }
  return { openNow: false, label: 'Closed' };
}
