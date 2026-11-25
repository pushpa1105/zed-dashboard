import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { uid } from '../db';
import { errorResponse, networkDelay, requireAuth } from '../utils';

/** Mock API for the "app-files" feature: an in-memory file tree. */

type FileType =
  'folder' | 'image' | 'pdf' | 'doc' | 'sheet' | 'slides' | 'video' | 'audio' | 'archive' | 'code';
type Item = {
  id: string;
  parentId: string | null;
  name: string;
  type: FileType;
  size: number;
  updatedAt: number;
  openedAt: number;
  starred: boolean;
  owner: string;
};

const ROOT = 'root';
const DAY = 86_400_000;
const QUOTA = 100 * 1024 ** 3;
let items: Item[] = [];

const typeOf = (name: string): FileType => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'heic'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'md', 'txt', 'rtf'].includes(ext)) return 'doc';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet';
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'slides';
  if (['mp4', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'm4a'].includes(ext)) return 'audio';
  if (['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)) return 'archive';
  if (['ts', 'tsx', 'js', 'json', 'py', 'sql', 'css', 'html'].includes(ext)) return 'code';
  return 'doc';
};

function seed() {
  const now = Date.now();
  let n = 0;
  const folder = (
    id: string,
    parentId: string | null,
    name: string,
    daysAgo: number,
    starred = false,
  ): Item => ({
    id,
    parentId,
    name,
    type: 'folder',
    size: 0,
    updatedAt: now - daysAgo * DAY,
    openedAt: now - daysAgo * DAY,
    starred,
    owner: 'You',
  });
  const file = (
    parentId: string,
    name: string,
    mb: number,
    daysAgo: number,
    extra: Partial<Item> = {},
  ): Item => ({
    id: `f${++n}`,
    parentId,
    name,
    type: typeOf(name),
    size: Math.round(mb * 1024 ** 2),
    updatedAt: now - daysAgo * DAY - n * 3_600_000,
    openedAt: now - daysAgo * DAY * 0.6 - n * 1_800_000,
    starred: false,
    owner: 'You',
    ...extra,
  });

  items = [
    folder('design', ROOT, 'Design', 2, true),
    folder('brand', 'design', 'Brand assets', 9),
    folder('ui', 'design', 'Product UI', 2),
    folder('finance', ROOT, 'Finance', 4),
    folder('reports', 'finance', 'Monthly reports', 4),
    folder('invoices', 'finance', 'Invoices 2026', 6),
    folder('eng', ROOT, 'Engineering', 1, true),
    folder('specs', 'eng', 'Specs', 1),
    folder('marketing', ROOT, 'Marketing', 12),
    folder('videos', 'marketing', 'Videos', 20),
    folder('hr', ROOT, 'People', 30),

    file(ROOT, 'Q4 board deck.pptx', 18.4, 1, { starred: true }),
    file(ROOT, 'Company handbook 2026.pdf', 4.2, 15),
    file(ROOT, 'Roadmap H1.xlsx', 0.6, 3),
    file(ROOT, 'team-offsite-lisbon.jpg', 6.8, 22),

    file('brand', 'logo-primary.svg', 0.04, 40),
    file('brand', 'logo-mark.png', 0.3, 40),
    file('brand', 'brand-guidelines.pdf', 12.6, 38, { starred: true }),
    file('brand', 'typeface-licenses.zip', 3.1, 60),
    file('ui', 'billing-v3-desktop.png', 1.2, 1, { owner: 'Hannah Morgan' }),
    file('ui', 'billing-v3-mobile.png', 0.8, 1, { owner: 'Hannah Morgan' }),
    file('ui', 'design-tokens.json', 0.02, 3, { owner: 'Aiko Tanaka' }),
    file('ui', 'onboarding-flow.pdf', 5.4, 8),

    file('reports', 'October close.pdf', 2.1, 25, { owner: 'Priya Raman' }),
    file('reports', 'September close.pdf', 2.3, 55, { owner: 'Priya Raman' }),
    file('reports', 'Accruals Nov.xlsx', 0.09, 2, { owner: 'Priya Raman', starred: true }),
    file('invoices', 'AWS-2026-10.pdf', 0.23, 24),
    file('invoices', 'Datadog-2026-10.pdf', 0.18, 24),
    file('invoices', 'Figma-2026-Q4.pdf', 0.12, 50),

    file('specs', 'usage-based-billing.md', 0.03, 1, { owner: 'Daniel Okafor' }),
    file('specs', 'exports-postmortem.md', 0.02, 4, { owner: 'Tom Becker' }),
    file('specs', 'schema-migration.sql', 0.01, 2, { owner: 'Daniel Okafor' }),
    file('eng', 'load-test-results.csv', 1.8, 1, { owner: 'Daniel Okafor' }),
    file('eng', 'architecture-2026.pdf', 3.6, 14),

    file('marketing', 'Launch post draft.docx', 0.4, 5, { owner: 'Megan Clark' }),
    file('marketing', 'Campaign results Q3.xlsx', 0.7, 40, { owner: 'Megan Clark' }),
    file('videos', 'product-tour-v2.mp4', 412, 18, { owner: 'Megan Clark' }),
    file('videos', 'customer-story-northwind.mov', 1240, 32, { owner: 'Megan Clark' }),
    file('videos', 'podcast-ep12.mp3', 58, 26),

    file('hr', 'Onboarding checklist.docx', 0.2, 30),
    file('hr', 'Benefits overview.pdf', 1.1, 90),
  ];
}
seed();

const folderSize = (id: string): number =>
  items
    .filter((i) => i.parentId === id)
    .reduce((sum, i) => sum + (i.type === 'folder' ? folderSize(i.id) : i.size), 0);
const childCount = (id: string) => items.filter((i) => i.parentId === id).length;

const view = (i: Item) => ({
  ...i,
  size: i.type === 'folder' ? folderSize(i.id) : i.size,
  childCount: i.type === 'folder' ? childCount(i.id) : 0,
});

function breadcrumbs(id: string | null) {
  const trail: Array<{ id: string; name: string }> = [];
  let current = items.find((i) => i.id === id);
  while (current) {
    trail.unshift({ id: current.id, name: current.name });
    current = items.find((i) => i.id === current!.parentId);
  }
  return trail;
}

const SORTERS: Record<string, (a: Item, b: Item) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  updated: (a, b) => b.updatedAt - a.updatedAt,
  size: (a, b) => view(b).size - view(a).size,
  type: (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
};

export const appFilesHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/files`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const url = new URL(request.url);
    const parent = url.searchParams.get('parent') ?? ROOT;
    const scope = url.searchParams.get('scope') ?? 'folder';
    const q = url.searchParams.get('q')?.toLowerCase().trim();
    const sort = SORTERS[url.searchParams.get('sort') ?? 'name'] ?? SORTERS.name!;

    let list =
      scope === 'recent'
        ? items
            .filter((i) => i.type !== 'folder')
            .sort((a, b) => b.openedAt - a.openedAt)
            .slice(0, 12)
        : scope === 'starred'
          ? items.filter((i) => i.starred)
          : q
            ? items.filter((i) => i.name.toLowerCase().includes(q))
            : items.filter((i) => i.parentId === parent);
    if (scope !== 'recent') {
      list = [...list].sort(
        (a, b) => Number(b.type === 'folder') - Number(a.type === 'folder') || sort(a, b),
      );
    }
    return HttpResponse.json({
      items: list.map(view),
      breadcrumbs: scope === 'folder' && !q ? breadcrumbs(parent) : [],
    });
  }),

  http.get(`${env.API_URL}/files/tree`, async ({ request }) => {
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const build = (parentId: string): unknown[] =>
      items
        .filter((i) => i.parentId === parentId && i.type === 'folder')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((i) => ({ id: i.id, name: i.name, children: build(i.id) }));
    return HttpResponse.json(build(ROOT));
  }),

  http.get(`${env.API_URL}/files/storage`, async ({ request }) => {
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const groups: Record<string, FileType[]> = {
      documents: ['doc', 'pdf', 'sheet', 'slides', 'code'],
      images: ['image'],
      media: ['video', 'audio'],
      other: ['archive'],
    };
    const byType = Object.entries(groups).map(([id, types]) => ({
      id,
      bytes: items.filter((i) => types.includes(i.type)).reduce((s, i) => s + i.size, 0),
    }));
    // Pad with other workspace data so the meter looks like a real account.
    const used = byType.reduce((s, g) => s + g.bytes, 0) + 38.2 * 1024 ** 3;
    return HttpResponse.json({ used, quota: QUOTA, byType });
  }),

  http.post<never, { name: string; parentId: string }>(
    `${env.API_URL}/files/folders`,
    async ({ request }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const { name, parentId } = await request.json();
      if (!name.trim()) return errorResponse('Name is required', 422);
      if (
        items.some(
          (i) => i.parentId === parentId && i.name.toLowerCase() === name.trim().toLowerCase(),
        )
      ) {
        return errorResponse('An item with this name already exists here', 409);
      }
      const now = Date.now();
      const folder: Item = {
        id: uid(),
        parentId,
        name: name.trim(),
        type: 'folder',
        size: 0,
        updatedAt: now,
        openedAt: now,
        starred: false,
        owner: 'You',
      };
      items.push(folder);
      return HttpResponse.json(view(folder));
    },
  ),

  http.post<never, { parentId: string; files: Array<{ name: string; size: number }> }>(
    `${env.API_URL}/files/upload`,
    async ({ request }) => {
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const { parentId, files } = await request.json();
      const now = Date.now();
      const created = files.map((f) => {
        const item: Item = {
          id: uid(),
          parentId,
          name: f.name,
          type: typeOf(f.name),
          size: f.size,
          updatedAt: now,
          openedAt: now,
          starred: false,
          owner: 'You',
        };
        items.push(item);
        return view(item);
      });
      return HttpResponse.json(created);
    },
  ),

  http.patch<{ id: string }, { name?: string; starred?: boolean; parentId?: string }>(
    `${env.API_URL}/files/:id`,
    async ({ request, params }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const item = items.find((i) => i.id === params.id);
      if (!item) return errorResponse('Not found', 404);
      const input = await request.json();
      if (input.name !== undefined) {
        if (!input.name.trim()) return errorResponse('Name is required', 422);
        item.name = input.name.trim();
        item.updatedAt = Date.now();
      }
      if (input.starred !== undefined) item.starred = input.starred;
      if (input.parentId !== undefined) item.parentId = input.parentId;
      return HttpResponse.json(view(item));
    },
  ),

  http.post<never, { ids: string[] }>(`${env.API_URL}/files/delete`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const { ids } = await request.json();
    const doomed = new Set<string>();
    const collect = (id: string) => {
      doomed.add(id);
      items.filter((i) => i.parentId === id).forEach((i) => collect(i.id));
    };
    ids.forEach(collect);
    items = items.filter((i) => !doomed.has(i.id));
    return HttpResponse.json({ deleted: doomed.size });
  }),
];
