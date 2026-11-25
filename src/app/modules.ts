import type { FeatureModule } from '@/core/feature/define-feature';
import academy from '@/features/academy';
import analytics from '@/features/analytics';
import appCalendar from '@/features/app-calendar';
import appChat from '@/features/app-chat';
import appFiles from '@/features/app-files';
import appInvoices from '@/features/app-invoices';
import appKanban from '@/features/app-kanban';
import appMail from '@/features/app-mail';
import auth from '@/features/auth';
import crm from '@/features/crm';
import dashboard from '@/features/dashboard';
import dataTables from '@/features/data-tables';
import ecommerce from '@/features/ecommerce';
import erp from '@/features/erp';
import hr from '@/features/hr';
import inventory from '@/features/inventory';
import landing from '@/features/landing';
import logistics from '@/features/logistics';
import pages from '@/features/pages';
import saas from '@/features/saas';
import settings from '@/features/settings';
import tasks from '@/features/tasks';
import uiElements from '@/features/ui-elements';
import uiForms from '@/features/ui-forms';
import users from '@/features/users';

/**
 * THE MODULE REGISTRY: the only list of features in the app.
 *
 * Add a feature: create `src/features/<name>/index.ts` and add it here
 * (`npm run generate` does both). Remove one: delete the line and the folder.
 * Routes, sidebar, ⌘K commands and translations follow automatically.
 */
export const modules: FeatureModule[] = [
  auth,
  dashboard,
  // Dashboard workspaces: keep the ones you want, delete the rest (see docs/templates.md).
  ecommerce,
  analytics,
  crm,
  erp,
  inventory,
  hr,
  academy,
  logistics,
  saas,
  // Apps
  appChat,
  appMail,
  appCalendar,
  appKanban,
  appFiles,
  appInvoices,
  pages,
  // Apps & component showcases
  tasks,
  dataTables,
  uiForms,
  uiElements,
  landing,
  users,
  settings,
];
