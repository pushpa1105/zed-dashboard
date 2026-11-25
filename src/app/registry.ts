import { LayoutGrid } from 'lucide-react';

import { hasRole } from '@/core/auth/access';
import type { User } from '@/core/auth/session';
import { getBrand } from '@/core/brand/store';
import { routes } from '@/core/config/routes';
import {
  NAV_GROUPS,
  type FeatureCommand,
  type FeatureModule,
  type FeatureNavItem,
  type FeatureRoute,
  type FeatureWorkspace,
  type NavGroup,
  type NavNode,
  type NavSection,
  type RouteAccess,
} from '@/core/feature/define-feature';

/** Pure helpers that turn feature manifests into what the app shell needs. */

export const getRoutes = (modules: FeatureModule[], access: RouteAccess): FeatureRoute[] =>
  modules.flatMap((m) => m.routes ?? []).filter((r) => r.access === access);

export const getNavItems = (modules: FeatureModule[], user: User | null | undefined) =>
  modules
    .flatMap((m) => m.nav ?? [])
    .filter((item) => hasRole(user, item.roles))
    .sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

/** Nav items bucketed by sidebar section, in NAV_GROUPS order; empty sections are dropped. */
export const getNavGroups = (
  modules: FeatureModule[],
  user: User | null | undefined,
): Array<{ group: NavGroup; items: FeatureNavItem[] }> => {
  const items = getNavItems(modules, user);
  return NAV_GROUPS.map((group) => ({
    group,
    items: items.filter((item) => (item.group ?? 'general') === group),
  })).filter((section) => section.items.length > 0);
};

export const getCommands = (modules: FeatureModule[], user: User | null | undefined) =>
  modules.flatMap((m) => m.commands ?? []).filter((command) => hasRole(user, command.roles));

export const getTranslations = (modules: FeatureModule[]) =>
  Object.fromEntries(modules.filter((m) => m.i18n).map((m) => [m.id, m.i18n!]));

/* -------------------------------------------------------------------------- */
/*  Workspaces                                                                  */
/* -------------------------------------------------------------------------- */

/** A workspace plus the id of the feature that declares it. */
export type Workspace = FeatureWorkspace & { id: string };

export const getWorkspaces = (modules: FeatureModule[]): Workspace[] =>
  modules
    .filter((m) => m.workspace)
    .map((m) => ({ ...m.workspace!, id: m.id }))
    .sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

/** Drops entries (and empty parents) the user's role may not see. */
export function filterNav(sections: NavSection[], user: User | null | undefined): NavSection[] {
  const visit = (nodes: NavNode[]): NavNode[] =>
    nodes
      .filter((node) => hasRole(user, node.roles))
      .map((node) => (node.children ? { ...node, children: visit(node.children) } : node))
      .filter((node) => node.to || node.children?.length);
  return sections
    .map((section) => ({ ...section, items: visit(section.items) }))
    .filter((section) => section.items.length > 0);
}

/** Every linkable entry, depth-first. */
export function flattenNav(nodes: NavNode[]): NavNode[] {
  return nodes.flatMap((node) => [
    ...(node.to ? [node] : []),
    ...(node.children ? flattenNav(node.children) : []),
  ]);
}

/** True when `pathname` is `to` or a sub-path of it (not merely a shared prefix). */
export const isActivePath = (pathname: string, to: string) => {
  const target = to.split('?')[0]!;
  return pathname === target || pathname.startsWith(`${target}/`);
};

/**
 * The chain of entries leading to the current page (root → leaf), picking
 * the most specific match. Drives active states, open submenus and breadcrumbs.
 *
 * Links to `exactPaths` (e.g. a workspace's home at its base path) only match
 * exactly; otherwise the home would claim every page of the workspace.
 * A link with a query (`/orders?status=pending`) matches only when the URL
 * has the same values, and then beats the plain link to the same path.
 */
export function findActiveTrail(
  sections: NavSection[],
  pathname: string,
  exactPaths: string[] = [],
  search = '',
): NavNode[] {
  const current = new URLSearchParams(search);
  let best: NavNode[] = [];
  let bestScore = -1;
  const visit = (nodes: NavNode[], trail: NavNode[]) => {
    for (const node of nodes) {
      const next = [...trail, node];
      const [target, query = ''] = node.to?.split('?') ?? [];
      const params = [...new URLSearchParams(query)];
      const matches =
        target !== undefined &&
        !node.external &&
        (exactPaths.includes(target) ? pathname === target : isActivePath(pathname, target)) &&
        params.every(([key, value]) => current.get(key) === value);
      if (matches) {
        const score = target.length * 100 + params.length;
        if (score > bestScore) {
          best = next;
          bestScore = score;
        }
      }
      if (node.children) visit(node.children, next);
    }
  };
  for (const section of sections) visit(section.items, []);
  return best;
}

/** The section holding the start of the active trail (falls back to the first). */
export const findActiveSection = (sections: NavSection[], trail: NavNode[]) =>
  sections.find((section) => trail[0] && section.items.includes(trail[0])) ?? sections[0];

/**
 * The main app (components, apps, settings…) is itself a workspace: its menu
 * comes from the features' `nav` entries, plus a section linking to every
 * dashboard workspace.
 */
export function buildAppWorkspace(modules: FeatureModule[], user: User | null | undefined) {
  const workspaces = getWorkspaces(modules);
  const groups = getNavGroups(modules, user);
  const toNode = (item: FeatureNavItem): NavNode => ({
    to: item.to,
    icon: item.icon,
    label: item.label,
  });

  const sections: NavSection[] = groups.map(({ group, items }) => ({
    id: group,
    label: (t) => t(`navGroups.${group}`),
    icon: items[0]?.icon,
    items: items.map(toNode),
  }));

  if (workspaces.length) {
    const dashboards: NavSection = {
      id: 'workspaces',
      label: (t) => t('navGroups.dashboards'),
      icon: LayoutGrid,
      items: workspaces.map((ws) => ({
        to: ws.basePath,
        icon: ws.icon,
        label: ws.name,
        description: ws.description,
      })),
    };
    const after = sections.findIndex((s) => s.id === 'general');
    sections.splice(after + 1, 0, dashboards);
  }

  const app: Workspace = {
    id: 'app',
    basePath: routes.app.path,
    name: () => getBrand().name,
    description: (t) => t('shell.appDescription'),
    icon: LayoutGrid,
    layout: 'sidebar',
    nav: sections,
    routes: [],
  };
  return app;
}

/* -------------------------------------------------------------------------- */
/*  Validation                                                                  */
/* -------------------------------------------------------------------------- */

/** Links from a workspace's notifications, Create menu and account menu. */
const workspaceShellLinks = (ws: FeatureWorkspace): string[] => [
  ...(ws.notifications?.items.flatMap((item) => (item.to ? [item.to] : [])) ?? []),
  ...[ws.notifications?.viewAllTo, ws.notifications?.settingsTo].filter((to) => to !== undefined),
  ...(ws.quickActions ?? []).map((action) => action.to),
  ...(ws.accountLinks ?? []).map((link) => link.to),
];

/**
 * Checks the registry for mistakes that would otherwise fail silently:
 * duplicate ids/paths, links pointing nowhere, workspace routes outside their
 * prefix, missing languages. Runs in a unit test and in development at startup.
 */
export function validateModules(modules: FeatureModule[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const paths = new Map<string, string>();
  const claim = (path: string, owner: string) => {
    const existing = paths.get(path);
    if (existing) problems.push(`Path "${path}" is declared by "${existing}" and "${owner}"`);
    paths.set(path, owner);
  };

  for (const m of modules) {
    if (ids.has(m.id)) problems.push(`Duplicate module id "${m.id}"`);
    ids.add(m.id);

    for (const route of m.routes ?? []) claim(route.path, m.id);

    if (m.workspace) {
      const { basePath } = m.workspace;
      if (!m.workspace.routes.some((route) => route.path === basePath)) claim(basePath, m.id);
      for (const route of m.workspace.routes) {
        if (!route.path.startsWith(`${basePath}/`) && route.path !== basePath) {
          problems.push(`Workspace route "${route.path}" is outside "${basePath}" (${m.id})`);
        }
        claim(route.path, m.id);
      }
    }
  }

  const matchesRoute = (to: string) => {
    const pathname = to.split('?')[0]!;
    return [...paths.keys()].some((pattern) =>
      new RegExp(`^${pattern.replace(/:\w+/g, '[^/]+')}$`).test(pathname),
    );
  };

  const links: string[] = modules.flatMap((m) => [
    ...(m.nav ?? []).map((n) => n.to),
    ...(m.commands ?? []).map((c: FeatureCommand) => c.to),
    ...(m.workspace
      ? m.workspace.nav
          .flatMap((section) => flattenNav(section.items))
          .filter((node) => !node.external && !node.disabled)
          .map((node) => node.to!)
      : []),
    ...(m.workspace ? workspaceShellLinks(m.workspace) : []),
  ]);
  for (const to of links) {
    if (!matchesRoute(to)) problems.push(`Link "${to}" does not match any route`);
  }

  for (const m of modules) {
    const feed = m.workspace?.notifications;
    if (!feed) continue;
    const categories = new Set(feed.categories.map((c) => c.id));
    for (const item of feed.items) {
      if (!categories.has(item.category)) {
        problems.push(
          `Notification "${item.id}" has unknown category "${item.category}" (${m.id})`,
        );
      }
    }
  }

  return problems;
}
