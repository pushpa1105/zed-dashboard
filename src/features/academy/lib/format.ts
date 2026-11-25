/** 205 → "3h 25m", 45 → "45m". */
export const minutes = (total: number) => {
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const compact = (n: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export const price = (n: number) =>
  n === 0
    ? null
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(n);

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export const dayTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** Seconds → "3:07". */
export const clock = (sec: number) =>
  `${Math.floor(sec / 60)}:${Math.floor(sec % 60)
    .toString()
    .padStart(2, '0')}`;

export const percent = (n: number | null) => (n === null ? '—' : `${n}%`);

/** Whole-number share of `part` in `whole`, in percent. */
export const rate = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

/** 48210 → "$48.2K". */
export const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
