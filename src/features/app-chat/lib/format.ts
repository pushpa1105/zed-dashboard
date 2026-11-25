import { formatDate } from '@/shared/lib/format';

const DAY = 86_400_000;

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** "14:05" today, "Mon" this week, "Nov 12" otherwise. */
export function listTime(ts: number, now = Date.now()) {
  const today = startOfDay(now);
  if (ts >= today) return formatDate(ts, 'HH:mm');
  if (ts >= today - 6 * DAY) return formatDate(ts, 'ddd');
  return formatDate(ts, 'MMM D');
}

/** Day bucket key + label for separators in a thread. */
export function dayKey(ts: number) {
  return startOfDay(ts);
}

export function dayLabel(
  ts: number,
  labels: { today: string; yesterday: string },
  now = Date.now(),
) {
  const day = startOfDay(ts);
  const today = startOfDay(now);
  if (day === today) return labels.today;
  if (day === today - DAY) return labels.yesterday;
  return formatDate(ts, 'dddd, MMMM D');
}

export const formatSize = (bytes: number) =>
  bytes < 1024 ** 2
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 ** 2).toFixed(1)} MB`;

/** Guesses an attachment kind from a file name. */
export function kindFromName(name: string): 'image' | 'pdf' | 'doc' | 'sheet' | 'zip' {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['xls', 'xlsx', 'csv', 'numbers'].includes(ext)) return 'sheet';
  if (['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)) return 'zip';
  return 'doc';
}
