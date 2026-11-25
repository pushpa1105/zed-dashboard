import {
  endOfMonth,
  endOfQuarter,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  subDays,
  subQuarters,
} from 'date-fns';
import type { DateRange } from 'react-day-picker';

export type DateRangePreset = { key: string; label: string; range: () => DateRange };

/** Common analytics ranges. Pass your own `presets` to replace them. */
export const DEFAULT_RANGE_PRESETS: DateRangePreset[] = [
  {
    key: 'today',
    label: 'Today',
    range: () => ({ from: startOfDay(new Date()), to: startOfDay(new Date()) }),
  },
  {
    key: '7d',
    label: 'Last 7 days',
    range: () => ({ from: subDays(startOfDay(new Date()), 6), to: startOfDay(new Date()) }),
  },
  {
    key: '30d',
    label: 'Last 30 days',
    range: () => ({ from: subDays(startOfDay(new Date()), 29), to: startOfDay(new Date()) }),
  },
  {
    key: 'month',
    label: 'This month',
    range: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  },
  {
    key: 'lastQuarter',
    label: 'Last quarter',
    range: () => {
      const q = subQuarters(new Date(), 1);
      return { from: startOfQuarter(q), to: endOfQuarter(q) };
    },
  },
];
