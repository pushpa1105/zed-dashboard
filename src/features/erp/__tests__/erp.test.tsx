import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

const wait = { timeout: 15_000 };

describe('ERP workspace', () => {
  it('renders the finance home inside the boxed shell', { timeout: 30_000 }, async () => {
    await renderApp('/erp', { user: 'admin' });
    expect(await screen.findByRole('heading', { name: 'Average sales' }, wait)).toBeInTheDocument();
    // The workspace menu (boxed layout) lists nested sections.
    expect(screen.getAllByText('Financial statements').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Accounting').length).toBeGreaterThan(0);
  });

  it('shows a balanced trial balance in the chart of accounts', { timeout: 30_000 }, async () => {
    await renderApp('/erp/accounting/accounts', { user: 'admin' });
    const table = await screen.findByRole('table', { name: 'Accounts' }, wait);
    expect(within(table).getByText('Cash — Operating (Chase ••4821)')).toBeInTheDocument();
    expect(await screen.findByText('Trial balance is in balance', {}, wait)).toBeInTheDocument();
  });

  it('approves a pending purchase order', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/erp/purchasing/payables', { user: 'admin' });
    const approve = await screen.findByRole('button', { name: /^approve$/i }, wait);
    await userEvent.click(approve);
    await waitFor(() => expect(screen.getAllByText(/approved$/).length).toBeGreaterThan(0), wait);
  });
});

describe('ERP operations', () => {
  it('approves a draft purchase order from the list', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/erp/purchase-orders', { user: 'admin' });
    const table = await screen.findByRole('table', { name: 'Orders' }, wait);
    const approve = within(table).getByRole('button', { name: 'Approve PO-4180' });
    await userEvent.click(approve);
    expect(await screen.findByText('PO-4180 approved', {}, wait)).toBeInTheDocument();
  });

  it('shows line items and receiving progress on a PO', { timeout: 30_000 }, async () => {
    await renderApp('/erp/purchase-orders/PO-4170', { user: 'admin' });
    expect(
      await screen.findByRole('heading', { name: 'Purchase order PO-4170' }, wait),
    ).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Line items' })).toBeInTheDocument();
    expect(screen.getAllByText('Receiving progress').length).toBeGreaterThan(0);
  });

  it('matches a bank line to a ledger entry', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/erp/accounting/reconciliation', { user: 'admin' });
    const bank = await screen.findByRole('list', { name: 'Bank statement' }, wait);
    const before = (await screen.findByText(/matched pairs$/, {}, wait)).textContent;
    await waitFor(
      () => expect(within(bank).getAllByRole('button').length).toBeGreaterThan(0),
      wait,
    );
    // Pick a bank line that has a ledger counterpart (a "Same amount" suggestion appears).
    for (const line of within(bank).getAllByRole('button')) {
      await userEvent.click(line);
      if (screen.queryByText('Same amount')) break;
    }
    await userEvent.click(screen.getByText('Same amount'));
    await userEvent.click(screen.getByRole('button', { name: 'Match' }));
    await waitFor(
      () => expect(screen.getByText(/matched pairs$/).textContent).not.toBe(before),
      wait,
    );
  });

  it('lists fixed assets and validates the add-asset form', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/erp/accounting/fixed-assets', { user: 'admin' });
    const table = await screen.findByRole('table', { name: 'Asset register' }, wait);
    expect(within(table).getByText('Pick-and-place SMT line')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Depreciation schedule' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add asset' }));
    const dialog = await screen.findByRole('dialog', {}, wait);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add asset' }));
    expect(await within(dialog).findByText('Cost must be greater than zero')).toBeInTheDocument();
  });

  it('approves a pending expense claim', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/erp/purchasing/expense-claims', { user: 'admin' });
    const table = await screen.findByRole('table', { name: 'Claims' }, wait);
    expect(screen.getByRole('heading', { name: 'Spend by category' })).toBeInTheDocument();
    const [first] = within(table).getAllByRole('button');
    await userEvent.click(first!);
    const sheet = await screen.findByRole('dialog', {}, wait);
    expect(within(sheet).getByText('Receipts')).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole('button', { name: /approve/i }));
    expect(await screen.findByText(/EXP-\d+ approved/, {}, wait)).toBeInTheDocument();
  });
});

describe('ERP sales and treasury', () => {
  it('opens a customer statement from receivables', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/erp/sales/receivables?view=overdue', { user: 'admin' });
    const table = await screen.findByRole('table', { name: 'Customer balances' }, wait);
    expect(screen.getByRole('heading', { name: 'Aging by customer' })).toBeInTheDocument();
    const [first] = within(table).getAllByRole('row').slice(1);
    await userEvent.click(first!);
    const sheet = await screen.findByRole('dialog', {}, wait);
    expect(within(sheet).getByRole('table', { name: 'Open invoices' })).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole('button', { name: /send reminder/i }));
    expect(await screen.findByText('Payment reminder sent', {}, wait)).toBeInTheDocument();
  });

  it('confirms a quote from the sales order list', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/erp/sales/orders?status=quote', { user: 'admin' });
    const table = await screen.findByRole('table', { name: 'Orders' }, wait);
    await userEvent.click(within(table).getByRole('button', { name: 'Confirm SO-7320' }));
    expect(await screen.findByText('SO-7320 confirmed', {}, wait)).toBeInTheDocument();
  });

  it('switches the cash forecast scenario', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/erp/planning/cash-forecast', { user: 'admin' });
    expect(await screen.findByRole('table', { name: 'Expected items' }, wait)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Weekly cash flows' })).toBeInTheDocument();
    const pessimistic = screen.getByRole('radio', { name: 'Pessimistic' });
    await userEvent.click(pessimistic);
    await waitFor(() => expect(pessimistic).toHaveAttribute('aria-checked', 'true'), wait);
  });
});
