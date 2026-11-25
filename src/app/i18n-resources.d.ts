import 'i18next';

import type common from '@/core/i18n/locales/en.json';
import type academy from '@/features/academy/i18n/en.json';
import type analytics from '@/features/analytics/i18n/en.json';
import type appCalendar from '@/features/app-calendar/i18n/en.json';
import type appChat from '@/features/app-chat/i18n/en.json';
import type appFiles from '@/features/app-files/i18n/en.json';
import type appInvoices from '@/features/app-invoices/i18n/en.json';
import type appKanban from '@/features/app-kanban/i18n/en.json';
import type appMail from '@/features/app-mail/i18n/en.json';
import type auth from '@/features/auth/i18n/en.json';
import type crm from '@/features/crm/i18n/en.json';
import type dashboard from '@/features/dashboard/i18n/en.json';
import type dataTables from '@/features/data-tables/i18n/en.json';
import type ecommerce from '@/features/ecommerce/i18n/en.json';
import type erp from '@/features/erp/i18n/en.json';
import type hr from '@/features/hr/i18n/en.json';
import type inventory from '@/features/inventory/i18n/en.json';
import type landing from '@/features/landing/i18n/en.json';
import type logistics from '@/features/logistics/i18n/en.json';
import type pages from '@/features/pages/i18n/en.json';
import type saas from '@/features/saas/i18n/en.json';
import type settings from '@/features/settings/i18n/en.json';
import type tasks from '@/features/tasks/i18n/en.json';
import type uiElements from '@/features/ui-elements/i18n/en.json';
import type uiForms from '@/features/ui-forms/i18n/en.json';
import type users from '@/features/users/i18n/en.json';

/**
 * Type-safe translation keys: `t('tasks:status.done')` autocompletes and a
 * typo is a compile error. One line per namespace (the generator adds it).
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      auth: typeof auth;
      dashboard: typeof dashboard;
      ecommerce: typeof ecommerce;
      analytics: typeof analytics;
      crm: typeof crm;
      erp: typeof erp;
      inventory: typeof inventory;
      hr: typeof hr;
      academy: typeof academy;
      logistics: typeof logistics;
      saas: typeof saas;
      'app-chat': typeof appChat;
      'app-mail': typeof appMail;
      'app-calendar': typeof appCalendar;
      'app-kanban': typeof appKanban;
      'app-files': typeof appFiles;
      'app-invoices': typeof appInvoices;
      pages: typeof pages;
      'data-tables': typeof dataTables;
      'ui-forms': typeof uiForms;
      'ui-elements': typeof uiElements;
      landing: typeof landing;
      settings: typeof settings;
      tasks: typeof tasks;
      users: typeof users;
    };
  }
}
