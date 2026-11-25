import { renderApp, screen, within } from '@/testing/test-utils';

const slow = { timeout: 15_000 };

describe('Logistics workspace: carriers, SLAs and performance', () => {
  it('lists carriers and opens a carrier scorecard', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/logistics/carriers', { user: 'admin' });

    const table = await screen.findByRole('table', { name: 'Partner carriers' }, slow);
    await userEvent.click(within(table).getByRole('button', { name: 'Northline Freight' }));

    expect(await screen.findByText('Contracted lanes', undefined, slow)).toBeInTheDocument();
    expect(screen.getByText('Contract end')).toBeInTheDocument();
  });

  it('filters customer SLAs from the query string', { timeout: 30_000 }, async () => {
    await renderApp('/logistics/slas?status=breached', { user: 'admin' });

    const table = await screen.findByRole('table', { name: 'Customers' }, slow);
    const badges = within(table).getAllByText(/^(Met|At risk|Breached)$/);
    expect(badges.every((b) => b.textContent === 'Breached')).toBe(true);
    expect(screen.getByRole('table', { name: 'SLA breaches' })).toBeInTheDocument();
  });

  it('shows the performance report with lane table', { timeout: 30_000 }, async () => {
    await renderApp('/logistics/performance?period=90d', { user: 'admin' });

    const table = await screen.findByRole('table', { name: 'Lane performance' }, slow);
    expect(within(table).getByText('Rotterdam → Hamburg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export/i })).toBeEnabled();
  });
});
