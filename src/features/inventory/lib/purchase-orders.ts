import type { PurchaseOrder } from '../model/inventory';

import { todayIso } from './format';

export const isOpenPo = (po: PurchaseOrder) => po.status === 'sent' || po.status === 'partial';
export const isLatePo = (po: PurchaseOrder) => isOpenPo(po) && po.expected < todayIso();
