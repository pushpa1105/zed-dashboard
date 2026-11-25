import { renderApp, screen, within } from '@/testing/test-utils';

describe('Invoices app', () => {
  it('lists invoices and filters by status', { timeout: 30_000 }, async () => {
    await renderApp('/app/invoices?status=draft', { user: 'admin' });

    const table = await screen.findByRole('table', {}, { timeout: 15_000 });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(within(row).getByText('Draft')).toBeInTheDocument();
  });

  it('opens an invoice document', { timeout: 30_000 }, async () => {
    await renderApp('/app/invoices/inv_2050', { user: 'admin' });

    expect(
      await screen.findByRole('heading', { name: 'INV-2050' }, { timeout: 15_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Total due')).toBeInTheDocument();
  });
});
