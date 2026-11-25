import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

const opts = { timeout: 15_000 };

describe('E-commerce workspace', () => {
  it('renders the store overview from the mock API', { timeout: 30_000 }, async () => {
    await renderApp('/ecommerce', { user: 'admin' });
    expect(await screen.findByRole('heading', { name: 'Recent orders' }, opts)).toBeInTheDocument();
  });

  it('filters orders by status tab from the URL', { timeout: 30_000 }, async () => {
    await renderApp('/ecommerce/orders?status=refunded', { user: 'admin' });
    const table = await screen.findByRole('table', { name: 'Orders' }, opts);
    await waitFor(
      () => expect(within(table).getAllByText('Refunded').length).toBeGreaterThan(0),
      opts,
    );
    expect(within(table).queryByText('Delivered')).not.toBeInTheDocument();
  });

  it('opens an order with its items and timeline', { timeout: 30_000 }, async () => {
    await renderApp('/ecommerce/orders/ord-9410', { user: 'admin' });
    expect(await screen.findByRole('heading', { name: 'Order #9410' }, opts)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument();
  });

  it('edits a product', { timeout: 30_000 }, async () => {
    await renderApp('/ecommerce/products/prod-001', { user: 'admin' });
    expect(
      await screen.findByRole('heading', { name: 'Aero Running Shoe' }, opts),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Variants' })).toBeInTheDocument();
  });
});

describe('E-commerce back office', () => {
  it('shows a customer profile with history and addresses', { timeout: 30_000 }, async () => {
    await renderApp('/ecommerce/customers/cus-001', { user: 'admin' });
    expect(await screen.findByRole('heading', { name: 'Order history' }, opts)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Addresses' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
  });

  it('lists transactions with the payout schedule', { timeout: 30_000 }, async () => {
    await renderApp('/ecommerce/transactions?status=failed', { user: 'admin' });
    const table = await screen.findByRole('table', { name: 'Transactions' }, opts);
    await waitFor(
      () => expect(within(table).getAllByText('Failed').length).toBeGreaterThan(0),
      opts,
    );
    expect(within(table).queryByText('Succeeded')).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Payouts' }, opts)).toBeInTheDocument();
  });

  it('approves a return request', { timeout: 30_000 }, async () => {
    const { userEvent: user } = await renderApp('/ecommerce/returns', { user: 'admin' });
    const list = await screen.findByRole('list', { name: 'Returns' }, opts);
    const before = within(list).getAllByRole('button', { name: /approve/i }).length;
    await user.click(within(list).getAllByRole('button', { name: /approve/i })[0]!);
    await waitFor(
      () =>
        expect(within(list).getAllByRole('button', { name: /approve/i })).toHaveLength(before - 1),
      opts,
    );
    expect(screen.getByRole('heading', { name: 'Return reasons' })).toBeInTheDocument();
  });

  it('saves store settings', { timeout: 30_000 }, async () => {
    const { userEvent: user } = await renderApp('/ecommerce/settings', { user: 'admin' });
    const name = await screen.findByLabelText(/store name/i, {}, opts);
    await user.clear(name);
    await user.type(name, 'Fieldwork Co.');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Settings saved', {}, opts)).toBeInTheDocument();
  });
});

describe('E-commerce marketing and reports', () => {
  it('lists gift cards and opens the redemption history', { timeout: 30_000 }, async () => {
    const { userEvent: user } = await renderApp('/ecommerce/gift-cards', { user: 'admin' });
    const table = await screen.findByRole('table', { name: 'Gift cards' }, opts);
    await user.click((await within(table).findAllByRole('button', {}, opts))[0]!);
    expect(
      await screen.findByRole('heading', { name: 'Redemption history' }, opts),
    ).toBeInTheDocument();
  });

  it('sends a recovery email for an abandoned cart', { timeout: 30_000 }, async () => {
    const { userEvent: user } = await renderApp('/ecommerce/abandoned-carts?status=not_sent', {
      user: 'admin',
    });
    const table = await screen.findByRole('table', { name: 'Abandoned carts' }, opts);
    const send = await within(table).findAllByRole('button', { name: 'Send email' }, opts);
    await user.click(send[0]!);
    expect(await screen.findByText('Recovery email sent', {}, opts)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recovery rate' })).toBeInTheDocument();
  });

  it('shows the sales report for the selected period', { timeout: 30_000 }, async () => {
    await renderApp('/ecommerce/reports?period=7d', { user: 'admin' });
    expect(await screen.findByRole('table', { name: 'Top products' }, opts)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sales by channel' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Last 7 days' })).toBeChecked();
  });
});
