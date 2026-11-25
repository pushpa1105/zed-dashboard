import { useThemeStore } from '@/core/theme/store';
import {
  checkStateOf,
  filterTree,
  moveSibling,
  toggleChecked,
} from '@/shared/components/tree/tree-utils';
import { renderApp, screen, within } from '@/testing/test-utils';

// Render the real router and providers with only this feature registered, so
// the suite doesn't depend on (or break with) unrelated features.
vi.mock('@/app/modules', async () => ({
  modules: [(await import('../index')).default],
}));

const tree = [
  {
    id: 'a',
    label: 'Alpha',
    children: [
      { id: 'a1', label: 'Alpha one' },
      { id: 'a2', label: 'Beta two' },
    ],
  },
  { id: 'b', label: 'Gamma' },
];

describe('tree utils', () => {
  it('computes tri-state checks from leaves', () => {
    expect(checkStateOf(tree[0]!, new Set(['a1']))).toBe('indeterminate');
    expect(checkStateOf(tree[0]!, new Set(['a1', 'a2']))).toBe('checked');
    expect([...toggleChecked(tree[0]!, new Set(['a1']))].sort()).toEqual(['a1', 'a2']);
    expect(toggleChecked(tree[0]!, new Set(['a1', 'a2'])).size).toBe(0);
  });

  it('filters while keeping ancestors and reorders siblings', () => {
    const { items, expand } = filterTree(tree, 'beta');
    expect(items.map((n) => n.id)).toEqual(['a']);
    expect(items[0]!.children!.map((n) => n.id)).toEqual(['a2']);
    expect([...expand]).toEqual(['a']);
    expect(moveSibling(tree, 'b', -1).map((n) => n.id)).toEqual(['b', 'a']);
  });
});

describe('Elements showcase pages', () => {
  const pages: Array<[string, string]> = [
    ['/app/ui/trees', 'Trees'],
    ['/app/ui/timelines', 'Timelines'],
    ['/app/ui/menus', 'Menus'],
    ['/app/ui/widgets', 'Widgets'],
  ];

  for (const [url, heading] of pages) {
    it(`renders ${url}`, { timeout: 30_000 }, async () => {
      await renderApp(url, { user: 'admin' });
      expect(
        await screen.findByRole('heading', { level: 1, name: heading }, { timeout: 15_000 }),
      ).toBeInTheDocument();
    });
  }

  it(
    'applies a layout to every dashboard from the layouts gallery',
    { timeout: 30_000 },
    async () => {
      const { userEvent } = await renderApp('/app/ui/layouts', { user: 'admin' });
      const card = (
        await screen.findByRole('heading', { level: 2, name: 'Icon rail' }, { timeout: 15_000 })
      ).closest('article')!;

      await userEvent.click(within(card).getByRole('button', { name: /apply to all dashboards/i }));
      expect(useThemeStore.getState().layout).toBe('rail');
      useThemeStore.getState().setLayout('auto');
    },
  );
});
