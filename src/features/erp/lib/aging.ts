import type { AgingBucket } from '../model/erp';

/** Bucket colors go from calm to alarming as invoices age. */
export const BUCKET_COLOR: Record<AgingBucket, string> = {
  current: 'var(--chart-2)',
  '1-30': 'var(--chart-4)',
  '31-60': 'var(--warning)',
  '61-90': 'var(--chart-3)',
  '90+': 'var(--destructive)',
};
