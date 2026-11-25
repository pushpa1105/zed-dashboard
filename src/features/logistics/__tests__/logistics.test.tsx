import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

const slow = { timeout: 15_000 };

describe('Logistics workspace', () => {
  it(
    'shows the network overview with live KPIs and the exception list',
    { timeout: 30_000 },
    async () => {
      await renderApp('/logistics', { user: 'admin' });

      expect(
        await screen.findByRole('heading', { name: 'Network overview' }, slow),
      ).toBeInTheDocument();
      expect(await screen.findByRole('img', { name: 'Network map' }, slow)).toBeInTheDocument();
      expect(await screen.findByText('Needs attention')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /open the exception queue/i })).toBeInTheDocument();
    },
  );

  it(
    'opens a shipment from the list and shows its tracking timeline',
    { timeout: 30_000 },
    async () => {
      const { userEvent, router } = await renderApp('/logistics/shipments', { user: 'admin' });

      const table = await screen.findByRole('table', { name: 'Shipments' }, slow);
      const firstId = await waitFor(() => {
        const cell = within(table).getAllByText(/^SHP-\d+$/)[0];
        expect(cell).toBeDefined();
        return cell!;
      }, slow);
      const id = firstId.textContent!;
      await userEvent.click(firstId);

      await waitFor(() =>
        expect(router.state.location.pathname).toBe(`/logistics/shipments/${id}`),
      );
      expect(await screen.findByRole('heading', { name: id }, slow)).toBeInTheDocument();
      expect(
        await screen.findByText('Picked up from shipper dock', undefined, slow),
      ).toBeInTheDocument();
    },
  );

  it('resolves an exception from the queue', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/logistics/exceptions', { user: 'admin' });

    const options = await screen.findAllByRole('option', undefined, slow);
    const before = options.length;
    await userEvent.click(screen.getByRole('button', { name: /^resolve$/i }));

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(before - 1), slow);
  });
});

describe('Logistics workspace: dispatch, fleet detail, drivers and billing', () => {
  it(
    'assigns an unassigned order to a driver from the card menu',
    { timeout: 30_000 },
    async () => {
      const { userEvent } = await renderApp('/logistics/dispatch', { user: 'admin' });

      const board = await screen.findByRole('region', { name: 'Dispatch board' }, slow);
      const unassigned = within(board).getByText('Unassigned').closest('section')!;
      const before = within(unassigned).getAllByRole('listitem').length;

      await userEvent.click(
        within(unassigned).getAllByRole('button', { name: /^assign ORD-/i })[0]!,
      );
      await userEvent.click((await screen.findAllByRole('menuitem'))[0]!);

      await waitFor(
        () => expect(within(unassigned).getAllByRole('listitem')).toHaveLength(before - 1),
        slow,
      );
    },
  );

  it('opens a vehicle from the fleet page', { timeout: 30_000 }, async () => {
    const { userEvent, router } = await renderApp('/logistics/fleet', { user: 'admin' });

    const plate = (
      await screen.findAllByRole('link', { name: /^[A-Z]{2}-\d{3}-[A-Z]{2}$/ }, slow)
    )[0]!;
    await userEvent.click(plate);

    await waitFor(() => expect(router.state.location.pathname).toMatch(/\/logistics\/fleet\/veh-/));
    expect(await screen.findByText('Maintenance history', undefined, slow)).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('shows a driver profile with hours of service and trips', { timeout: 30_000 }, async () => {
    await renderApp('/logistics/drivers/drv-1', { user: 'admin' });

    expect(await screen.findByRole('heading', { name: 'Jonas Weber' }, slow)).toBeInTheDocument();
    expect(screen.getByText('Hours of service')).toBeInTheDocument();
    expect(screen.getByText('Recent trips')).toBeInTheDocument();
  });

  it('approves a pending carrier invoice', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/logistics/billing', { user: 'admin' });

    const table = await screen.findByRole('table', { name: 'Carrier invoices' }, slow);
    const rows = within(table).getAllByRole('row').length;
    await userEvent.click(within(table).getAllByRole('button', { name: /^approve INV-/i })[0]!);

    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(rows - 1), slow);
  });
});
