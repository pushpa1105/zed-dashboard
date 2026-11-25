import type { QueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

import type { Role } from '@/core/auth/session';
import type { Language } from '@/core/i18n/languages';
import type { FlatNamespace, TFunction } from '@/core/i18n/use-translation';
import type { LoaderFunction } from '@/core/router/router';
import type { ShellLayout } from '@/core/theme/config';

/**
 * The contract between a feature and the app.
 *
 * A feature never touches the router, the sidebar or the i18n setup. It
 * *declares* what it contributes in its `index.ts`, and `src/app` assembles
 * every registered module:
 *
 *   export default defineFeature({
 *     id: 'tasks',
 *     routes: [{ path: routes.tasks.path, access: 'protected', page: () => import('./pages/tasks-page') }],
 *     nav: [{ to: routes.tasks.href(), icon: ListTodo, label: (t) => t('tasks:nav') }],
 *     i18n: { en, es },
 *   });
 */

/** What a lazily-loaded page module must export. */
export type PageModule = {
  default: ComponentType;
  /** Optional data preloader, run before the page renders (see docs/routing.md). */
  loader?: (ctx: { queryClient: QueryClient }) => LoaderFunction;
};

export type RouteAccess =
  /** Anyone. Rendered without the app shell. */
  | 'public'
  /** Signed-out users only (sign-in, sign-up…). Rendered in the auth shell. */
  | 'guest'
  /** Signed-in users only. Rendered inside the app shell. */
  | 'protected';

export type FeatureRoute = {
  /** Absolute path: take it from `routes` in `core/config/routes.ts`. */
  path: string;
  access: RouteAccess;
  page: () => Promise<PageModule>;
  /** Restrict a protected route to some roles. */
  roles?: readonly Role[];
};

/**
 * Translates a label. `t` accepts any key of any namespace, e.g. `t('tasks:nav')`.
 * Using a function keeps labels type-checked and reactive to language changes.
 */
export type LabelFn = (t: TFunction<FlatNamespace[]>) => string;

/**
 * Resolves a label with any component's `t`. At runtime every `t` accepts
 * namespaced keys; only the static type differs, hence the single cast here.
 */
export const translateLabel = (label: LabelFn, t: (...args: never[]) => unknown) =>
  label(t as unknown as TFunction<FlatNamespace[]>);

/** Sidebar sections. Labels live in the common namespace (`navGroups.*`). */
export const NAV_GROUPS = [
  'general',
  'dashboards',
  'apps',
  'components',
  'pages',
  'account',
] as const;
export type NavGroup = (typeof NAV_GROUPS)[number];

export type FeatureNavItem = {
  to: string;
  /** Sidebar section. Defaults to `general`. */
  group?: NavGroup;
  icon: LucideIcon;
  label: LabelFn;
  /** Lower comes first. */
  order?: number;
  roles?: readonly Role[];
};

/** Extra entries for the ⌘K command menu (nav items are included automatically). */
export type FeatureCommand = {
  id: string;
  to: string;
  icon: LucideIcon;
  label: LabelFn;
  keywords?: string[];
  roles?: readonly Role[];
};

/* -------------------------------------------------------------------------- */
/*  Workspaces: complete dashboard products with their own shell and menu      */
/* -------------------------------------------------------------------------- */

export type NavBadgeTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

/** A count or short label next to a menu item ("12", "New", "Beta"). Use a LabelFn to translate it. */
export type NavBadge = string | number | { label: string | number | LabelFn; tone?: NavBadgeTone };

/**
 * One menu entry. Entries nest (any depth is rendered; 3 levels read best).
 * A parent without `to` only groups its children.
 */
export type NavNode = {
  /** Absolute link target. Omit on pure parents. */
  to?: string;
  label: LabelFn;
  icon?: LucideIcon;
  /** Shown in mega menus and flyouts. */
  description?: LabelFn;
  badge?: NavBadge;
  /** Rendered but not clickable (e.g. "coming soon", missing permission). */
  disabled?: boolean;
  /** Opens in a new tab. */
  external?: boolean;
  children?: NavNode[];
  roles?: readonly Role[];
};

/** A titled block of menu entries. */
export type NavSection = {
  id: string;
  label?: LabelFn;
  /** Used by layouts that show one icon per section (dual sidebar). */
  icon?: LucideIcon;
  items: NavNode[];
};

/** A filter tab in the notification center ("Orders", "Mentions"…). */
export type NotificationCategory = { id: string; label: LabelFn };

/**
 * One entry in the header notification center. These are sample items: in a
 * real app, load them from your notifications endpoint with the same shape.
 */
export type WorkspaceNotification = {
  id: string;
  /** One of the workspace's `notifications.categories` ids. */
  category: string;
  icon: LucideIcon;
  /** Color of the icon tile. Defaults to `default`. */
  tone?: NavBadgeTone;
  /** Person who triggered it. Shows their initials instead of the icon. */
  actor?: string;
  title: LabelFn;
  body?: LabelFn;
  /** Age of the sample item, in minutes. */
  minutesAgo: number;
  /** Opened on click. */
  to?: string;
  unread?: boolean;
};

export type WorkspaceNotifications = {
  categories: NotificationCategory[];
  items: WorkspaceNotification[];
  /** "View all" footer link. */
  viewAllTo?: string;
  /** "Settings" footer link (defaults to the account notification settings). */
  settingsTo?: string;
};

/** An entry of the header "Create" menu or of the account menu. */
export type WorkspaceShortcut = {
  id: string;
  to: string;
  icon: LucideIcon;
  label: LabelFn;
  /** One line under the label (Create menu only). */
  description?: LabelFn;
  roles?: readonly Role[];
};

/**
 * A workspace is a full dashboard product (E-commerce, CRM, LMS…): its own
 * URL prefix, shell layout, menu and pages. The app renders it inside the
 * shell named by `layout`, and lists it in the workspace switcher.
 */
export type FeatureWorkspace = {
  /** URL prefix, e.g. `/ecommerce`. Every route below must start with it. */
  basePath: string;
  name: LabelFn;
  /** One line for the switcher and the template gallery. */
  description: LabelFn;
  icon: LucideIcon;
  /** Default shell layout (see SHELL_LAYOUTS in core/theme/config). */
  layout: ShellLayout;
  /** Short tag shown in the switcher (e.g. "Retail", "Education"). */
  category?: LabelFn;
  nav: NavSection[];
  /** Pages rendered inside the workspace shell (always signed-in only). */
  routes: Array<Omit<FeatureRoute, 'access'>>;
  /** Static preview image (under /public) for galleries. */
  preview?: string;
  /** Order in the switcher; lower first. */
  order?: number;
  /** Header notification center. Falls back to generic samples. */
  notifications?: WorkspaceNotifications;
  /** Header "Create" menu. Hidden when empty. */
  quickActions?: WorkspaceShortcut[];
  /** Workspace links at the top of the account menu ("My deals", "My time off"…). */
  accountLinks?: WorkspaceShortcut[];
};

type TranslationTree = { [key: string]: string | TranslationTree };

/** English is required (it is the fallback language); other languages are optional. */
export type FeatureTranslations = { en: TranslationTree } & Partial<
  Record<Exclude<Language, 'en'>, TranslationTree>
>;

export type FeatureModule = {
  /** Unique id. Also the i18n namespace of the feature. */
  id: string;
  routes?: FeatureRoute[];
  nav?: FeatureNavItem[];
  commands?: FeatureCommand[];
  i18n?: FeatureTranslations;
  /** Makes this feature a standalone dashboard product (see FeatureWorkspace). */
  workspace?: FeatureWorkspace;
};

/** Identity helper that type-checks a feature manifest. */
export function defineFeature(feature: FeatureModule): FeatureModule {
  return feature;
}
