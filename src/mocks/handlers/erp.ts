import type { HttpHandler } from 'msw';

import { erpFinanceHandlers } from './erp-finance';
import { erpForecastHandlers } from './erp-forecast';
import { erpLedgerHandlers } from './erp-ledger';
import { erpOperationsHandlers } from './erp-operations';
import { erpProjectsHandlers } from './erp-projects';
import { erpSalesHandlers } from './erp-sales';
import { erpTradeHandlers } from './erp-trade';

/** Mock API for the "erp" workspace (split by domain for readability). */
export const erpHandlers: HttpHandler[] = [
  ...erpFinanceHandlers,
  ...erpProjectsHandlers,
  ...erpLedgerHandlers,
  ...erpTradeHandlers,
  ...erpOperationsHandlers,
  ...erpSalesHandlers,
  ...erpForecastHandlers,
];
