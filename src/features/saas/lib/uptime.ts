import type { StatusComponent } from '../model/admin';

const MINUTES_PER_DAY = 24 * 60;

/** Percentage of minutes without downtime across the given days. */
export const uptimeOf = (days: StatusComponent['days']) =>
  100 - (days.reduce((sum, d) => sum + d.downtime, 0) / (days.length * MINUTES_PER_DAY)) * 100;
