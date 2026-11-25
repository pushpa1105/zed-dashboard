import { http, HttpResponse } from 'msw';

import { env } from '@/core/config/env';

import { networkDelay } from '../utils';

import { academyHandlers } from './academy';
import { analyticsHandlers } from './analytics';
import { appCalendarHandlers } from './app-calendar';
import { appChatHandlers } from './app-chat';
import { appFilesHandlers } from './app-files';
import { appInvoicesHandlers } from './app-invoices';
import { appKanbanHandlers } from './app-kanban';
import { appMailHandlers } from './app-mail';
import { authHandlers } from './auth';
import { crmHandlers } from './crm';
import { dataTablesHandlers } from './data-tables';
import { ecommerceHandlers } from './ecommerce';
import { erpHandlers } from './erp';
import { hrHandlers } from './hr';
import { inventoryHandlers } from './inventory';
import { logisticsHandlers } from './logistics';
import { saasHandlers } from './saas';
import { tasksHandlers } from './tasks';
import { uiFormsHandlers } from './ui-forms';
import { usersHandlers } from './users';

export const handlers = [
  ...authHandlers,
  ...tasksHandlers,
  ...usersHandlers,
  ...ecommerceHandlers,
  ...analyticsHandlers,
  ...crmHandlers,
  ...erpHandlers,
  ...inventoryHandlers,
  ...hrHandlers,
  ...academyHandlers,
  ...logisticsHandlers,
  ...saasHandlers,
  ...appChatHandlers,
  ...appMailHandlers,
  ...appCalendarHandlers,
  ...appKanbanHandlers,
  ...appFilesHandlers,
  ...appInvoicesHandlers,
  ...dataTablesHandlers,
  ...uiFormsHandlers,
  http.get(`${env.API_URL}/healthcheck`, async () => {
    await networkDelay();
    return HttpResponse.json({ ok: true });
  }),
];
