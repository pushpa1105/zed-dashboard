import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

const T = { timeout: 15_000 };

describe('CRM workspace', () => {
  it('renders the sales overview with quota and closing deals', { timeout: 30_000 }, async () => {
    await renderApp('/crm', { user: 'admin' });

    expect(await screen.findByRole('heading', { name: 'Sales overview' }, T)).toBeInTheDocument();
    expect(await screen.findByText('Quota attainment', {}, T)).toBeInTheDocument();
    expect(await screen.findByText('Closing in the next 3 weeks', {}, T)).toBeInTheDocument();
  });

  it('lists deals in the table and opens a deal', { timeout: 30_000 }, async () => {
    const { userEvent, router } = await renderApp('/crm/deals', { user: 'admin' });

    const table = await screen.findByRole('table', { name: 'All deals' }, T);
    const link = (await within(table).findAllByRole('link', {}, T))[0]!;
    await userEvent.click(link);

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/crm\/deals\/d-\d+$/), T);
    expect(await screen.findByText('Stage progress', {}, T)).toBeInTheDocument();
  });

  it('shows the pipeline board with stage columns', { timeout: 30_000 }, async () => {
    await renderApp('/crm/pipeline', { user: 'admin' });

    expect(await screen.findByRole('heading', { name: 'Pipeline' }, T)).toBeInTheDocument();
    expect((await screen.findAllByText('Negotiation', {}, T)).length).toBeGreaterThan(0);
  });

  it('opens a company from the companies grid', { timeout: 30_000 }, async () => {
    const { userEvent, router } = await renderApp('/crm/companies', { user: 'admin' });

    await userEvent.click(await screen.findByRole('link', { name: 'Northwind Freight' }, T));

    await waitFor(() => expect(router.state.location.pathname).toBe('/crm/companies/co-1'), T);
    expect(await screen.findByText('Firmographics', {}, T)).toBeInTheDocument();
    expect(await screen.findByText('Closed-won revenue', {}, T)).toBeInTheDocument();
  });

  it('qualifies a lead from the inbox with bulk selection', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/crm/leads', { user: 'admin' });

    const table = await screen.findByRole('table', { name: 'Leads inbox' }, T);
    const before = within(table).getAllByRole('row').length;
    await userEvent.click(within(table).getAllByRole('checkbox')[1]!);
    const bar = await screen.findByRole('toolbar', { name: '1 lead selected' }, T);
    await userEvent.click(within(bar).getByRole('button', { name: 'Qualify' }));

    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(before - 1), T);
  });

  it('lists sequences and opens the editor', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/crm/sequences', { user: 'admin' });

    expect(await screen.findByText('Inbound demo follow-up', {}, T)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'New sequence' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Save sequence' }, T));

    expect((await screen.findAllByRole('alert', {}, T)).length).toBeGreaterThan(0);
  });

  it('shows the forecast and team leaderboard', { timeout: 30_000 }, async () => {
    await renderApp('/crm/forecast', { user: 'admin' });

    expect(
      await screen.findByRole('heading', { name: 'Forecast & quotas' }, T),
    ).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Team leaderboard' }, T)).toBeInTheDocument();
  });

  it('filters quotes from the nav link and opens the builder', { timeout: 30_000 }, async () => {
    const { userEvent, router } = await renderApp('/crm/quotes?status=sent', { user: 'admin' });

    const table = await screen.findByRole('table', { name: 'Quotes' }, T);
    expect(screen.getByRole('button', { name: /Sent/, pressed: true })).toBeInTheDocument();
    await userEvent.click((await within(table).findAllByRole('link', {}, T))[0]!);

    await waitFor(
      () => expect(router.state.location.pathname).toMatch(/^\/crm\/quotes\/q-\d+$/),
      T,
    );
    expect(await screen.findByText('Line items', {}, T)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark as accepted' })).toBeInTheDocument();
  });

  it('lists the price book and validates the product form', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/crm/products', { user: 'admin' });

    expect(
      await screen.findByRole('table', { name: 'Products & price book' }, T),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'New product' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Save product' }, T));

    expect((await screen.findAllByRole('alert', {}, T)).length).toBeGreaterThan(0);
  });

  it('shows the team activity feed', { timeout: 30_000 }, async () => {
    await renderApp('/crm/activity', { user: 'admin' });

    expect(await screen.findByRole('heading', { name: 'Activity feed' }, T)).toBeInTheDocument();
    expect(await screen.findByText('Activity by day', {}, T)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log activity' })).toBeInTheDocument();
  });
});
