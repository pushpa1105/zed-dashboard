import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

const SLOW = { timeout: 15_000 };

describe('data-tables: extra examples', { timeout: 30_000 }, () => {
  it('edits a spreadsheet cell from the keyboard and undoes it', async () => {
    const { userEvent } = await renderApp('/app/tables/spreadsheet', { user: 'admin' });
    const grid = await screen.findByRole('grid', { name: 'Spreadsheet' }, SLOW);
    const first = within(grid).getAllByRole('gridcell')[0]!;
    expect(first).toHaveTextContent('MacBook Pro 14"');

    await userEvent.click(first);
    await userEvent.keyboard('Laptops{Enter}');
    expect(within(grid).getAllByRole('gridcell')[0]).toHaveTextContent('Laptops');

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(within(grid).getAllByRole('gridcell')[0]).toHaveTextContent('MacBook Pro 14"');
  });

  it('expands every level of the tree table', async () => {
    const { userEvent } = await renderApp('/app/tables/tree', { user: 'admin' });
    await screen.findByRole('table', { name: 'Tree table' }, SLOW);
    expect(screen.queryByText('Security')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /expand all/i }));
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Company total')).toBeInTheDocument();
  });

  it('loads the first page of the audit log through the API', async () => {
    await renderApp('/app/tables/infinite', { user: 'admin' });
    await waitFor(
      () => expect(screen.getByText(/50 of 2,000 events loaded/)).toBeInTheDocument(),
      SLOW,
    );
    expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
  });

  it('renders the financial statement with subtotals and margin footer', async () => {
    await renderApp('/app/tables/financial', { user: 'admin' });
    expect(await screen.findByText('Gross profit', {}, SLOW)).toBeInTheDocument();
    expect(screen.getByText('Operating margin')).toBeInTheDocument();
  });
});
