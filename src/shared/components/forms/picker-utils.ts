/** Trigger styling shared by the date/time pickers (matches shadcn inputs). */
export const pickerTriggerClass =
  'flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30';

export const pad = (n: number) => String(n).padStart(2, '0');

/** "HH:mm" → "09:30" or "9:30 AM". */
export function formatTime(value: string, hour12?: boolean) {
  const [h = 0, m = 0] = value.split(':').map(Number);
  if (!hour12) return `${pad(h)}:${pad(m)}`;
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}
