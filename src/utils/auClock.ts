import type { AustralianTimezone } from '../store/useWindowStore';

export interface FormattedAuClock {
  time: string;
  timeWithSeconds: string;
  dateShort: string;
  dateLong: string;
  tzAbbr: string;
  resolvedTimeZone: string;
}

export const TIMEZONE_OPTIONS: Array<{
  value: AustralianTimezone;
  label: string;
  city: string;
}> = [
  { value: 'auto', label: 'Auto (Local Browser)', city: 'Local' },
  { value: 'Australia/Sydney', label: 'Sydney / Melbourne / Hobart', city: 'AET' },
  { value: 'Australia/Adelaide', label: 'Adelaide / Darwin', city: 'ACT' },
  { value: 'Australia/Perth', label: 'Perth (Western Australia)', city: 'AWT' },
];

export function formatAustralianClock(
  now: Date,
  timezone: AustralianTimezone,
): FormattedAuClock {
  const tzOpt = timezone === 'auto' ? undefined : timezone;
  const resolvedTimeZone =
    tzOpt ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Australia/Sydney';

  const time = new Intl.DateTimeFormat('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: tzOpt,
  }).format(now);

  const timeWithSeconds = new Intl.DateTimeFormat('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: tzOpt,
  }).format(now);

  const dateShort = new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: tzOpt,
  }).format(now);

  const dateLong = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: tzOpt,
  }).format(now);

  const parts = new Intl.DateTimeFormat('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: tzOpt,
  }).formatToParts(now);

  const tzAbbr =
    parts.find((p) => p.type === 'timeZoneName')?.value ?? 'LOCAL';

  return {
    time,
    timeWithSeconds,
    dateShort,
    dateLong,
    tzAbbr,
    resolvedTimeZone,
  };
}
