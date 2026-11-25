import type { Tone } from './tone';

/** Common statuses mapped to tones. Extend or override per call with `tone`. */
export const STATUS_TONES: Record<string, Tone> = {
  active: 'success',
  approved: 'success',
  paid: 'success',
  completed: 'success',
  done: 'success',
  delivered: 'success',
  successful: 'success',
  online: 'success',
  pending: 'warning',
  processing: 'info',
  in_progress: 'info',
  shipped: 'blue',
  review: 'violet',
  draft: 'neutral',
  inactive: 'neutral',
  offline: 'neutral',
  cancelled: 'danger',
  rejected: 'danger',
  failed: 'danger',
  overdue: 'danger',
  late: 'danger',
};
