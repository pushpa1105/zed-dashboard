import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

describe('Data tables feature', () => {
  it('loads a server page filtered and sorted through the URL', { timeout: 30_000 }, async () => {
    const { router } = await renderApp('/app/tables?status=refunded&sort=total:desc&pageSize=10', {
      user: 'admin',
    });

    // Generous timeout: the page chunk is large and the full suite runs in parallel.
    const table = await screen.findByRole('table', { name: 'Orders' }, { timeout: 15_000 });
    // Wait past the skeleton rows: 1 header row + 10 data rows, all refunded.
    await waitFor(() => expect(within(table).getAllByText('Refunded')).toHaveLength(10), {
      timeout: 15_000,
    });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(11);
    for (const row of rows.slice(1)) expect(within(row).getByText('Refunded')).toBeInTheDocument();

    const totals = rows
      .slice(1)
      .map((row) => Number(within(row).getByText(/^\$/).textContent!.replace(/[$,]/g, '')));
    expect(totals).toEqual([...totals].sort((a, b) => b - a));
    expect(router.state.location.search).toContain('status=refunded');
  });

  it('renders the virtualized client-side table', { timeout: 30_000 }, async () => {
    await renderApp('/app/tables/client', { user: 'admin' });
    expect(
      await screen.findByRole('table', { name: 'Transactions' }, { timeout: 15_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/10,000 rows ·/)).toBeInTheDocument();
  });
});
