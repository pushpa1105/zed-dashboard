import { renderApp, screen, within } from '@/testing/test-utils';

const SLOW = { timeout: 30_000 };

describe('Landing templates', () => {
  it('lists every dashboard with a one-click live preview', SLOW, async () => {
    await renderApp('/');

    const section = await screen.findByRole(
      'heading',
      { name: /complete dashboards/i },
      { timeout: 15_000 },
    );
    const templates = section.closest('section')!;
    const previews = within(templates).getAllByRole('link', { name: /live preview/i });
    expect(previews.length).toBeGreaterThan(0);
    expect(previews[0]).toHaveAttribute(
      'href',
      expect.stringContaining('/login?demo=admin&redirectTo='),
    );

    // The e2e smoke test relies on exactly one "Get started" link for visitors.
    expect(screen.getAllByRole('link', { name: /get started/i })).toHaveLength(1);
  });

  it('filters the gallery by search', SLOW, async () => {
    const { userEvent } = await renderApp('/templates');

    await screen.findByRole('heading', { name: /pick the dashboard/i }, { timeout: 15_000 });
    expect(screen.getAllByRole('link', { name: /live preview/i }).length).toBeGreaterThan(0);
    await userEvent.type(screen.getByPlaceholderText(/search templates/i), 'no-such-template');

    expect(screen.getByText(/no template matches/i)).toBeInTheDocument();
    expect(screen.queryAllByRole('link', { name: /live preview/i })).toHaveLength(0);
  });

  it.each(['/landing/agency', '/landing/ai'])('renders %s', SLOW, async (url) => {
    await renderApp(url);
    expect(
      await screen.findByRole('heading', { level: 1 }, { timeout: 15_000 }),
    ).toBeInTheDocument();
  });
});
