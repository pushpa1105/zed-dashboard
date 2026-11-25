import { renderApp, screen, waitFor } from '@/testing/test-utils';

const wait = { timeout: 15_000 };

describe('Inventory workspace', () => {
  it('renders the overview with stock value and alerts', { timeout: 30_000 }, async () => {
    await renderApp('/inventory', { user: 'admin' });
    expect(await screen.findByText('Stock value', {}, wait)).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Reorder suggestions' }, wait),
    ).toBeInTheDocument();
  });

  it('lists items in the stock table', { timeout: 30_000 }, async () => {
    await renderApp('/inventory/items', { user: 'admin' });
    expect(await screen.findByRole('table', { name: 'Items' }, wait)).toBeInTheDocument();
    await waitFor(
      () => expect(screen.getAllByText(/^OR-[A-Z]{3}-\d+$/).length).toBeGreaterThan(5),
      wait,
    );
  });

  it('tracks counted quantities on the cycle count sheet', { timeout: 30_000 }, async () => {
    await renderApp('/inventory/counts', { user: 'admin' });
    expect(await screen.findByRole('table', { name: /count sheet/i }, wait)).toBeInTheDocument();
    expect(screen.getByText('0/40')).toBeInTheDocument();
  });

  it('lists purchase orders with status tabs', { timeout: 30_000 }, async () => {
    await renderApp('/inventory/purchase-orders', { user: 'admin' });
    expect(await screen.findByRole('tab', { name: /^Draft/ }, wait)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(/^PO-\d{4}$/).length).toBeGreaterThan(5), wait);
  });

  it('opens the create purchase order dialog from the URL', { timeout: 30_000 }, async () => {
    await renderApp('/inventory/purchase-orders?new=1&supplier=SUP-101', { user: 'admin' });
    expect(
      await screen.findByRole('dialog', { name: 'New purchase order' }, wait),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeInTheDocument();
  });

  it('renders the stock movement ledger with its trend', { timeout: 30_000 }, async () => {
    await renderApp('/inventory/movements', { user: 'admin' });
    expect(
      await screen.findByRole('heading', { name: 'Movement trend' }, wait),
    ).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Movement ledger' }, wait)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(/^SO-\d+$/).length).toBeGreaterThan(3), wait);
  });

  it('suggests reorder quantities from daily usage', { timeout: 30_000 }, async () => {
    await renderApp('/inventory/reorder', { user: 'admin' });
    expect(await screen.findByText('Items to reorder', {}, wait)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(/\/day$/).length).toBeGreaterThan(3), wait);
  });

  it('shows a supplier with its items and purchase orders', { timeout: 30_000 }, async () => {
    await renderApp('/inventory/suppliers/SUP-101', { user: 'admin' });
    expect(await screen.findByText('Supplied items', {}, wait)).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Supplied items' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent purchase orders' })).toBeInTheDocument();
    expect(screen.getAllByText('Northwind Components').length).toBeGreaterThan(0);
  });

  it('filters batches by expiry window', { timeout: 30_000 }, async () => {
    await renderApp('/inventory/batches?window=30', { user: 'admin' });
    expect(await screen.findByRole('table', { name: 'Batches' }, wait)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /30 days/, selected: true })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(/days? left$/).length).toBeGreaterThan(0), wait);
  });

  it('draws the bin map and opens a bin', { timeout: 30_000 }, async () => {
    await renderApp('/inventory/bins?warehouse=DFW', { user: 'admin' });
    const bin = await screen.findByRole('button', { name: /^Bin A-01-01 / }, wait);
    bin.click();
    expect(await screen.findByRole('dialog', { name: 'Bin A-01-01' }, wait)).toBeInTheDocument();
  });

  it('values stock and lists slow movers', { timeout: 30_000 }, async () => {
    await renderApp('/inventory/valuation?method=average', { user: 'admin' });
    expect(await screen.findByText('Inventory value', {}, wait)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Average cost', checked: true })).toBeInTheDocument();
    expect(
      await screen.findByRole('table', { name: 'Slow-moving & dead stock' }, wait),
    ).toBeInTheDocument();
  });
});
