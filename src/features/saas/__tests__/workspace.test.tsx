import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

const opts = { timeout: 15_000 };

describe('SaaS workspace', () => {
  it('renders the usage overview from the mock API', { timeout: 30_000 }, async () => {
    await renderApp('/saas', { user: 'admin' });
    expect(await screen.findByRole('heading', { name: 'Integrations' }, opts)).toBeInTheDocument();
  });

  it('lists API keys masked', { timeout: 30_000 }, async () => {
    await renderApp('/saas/keys', { user: 'admin' });
    expect(await screen.findByText('Production backend', undefined, opts)).toBeInTheDocument();
    expect(screen.getByText('sk_live_4f9a••••••••')).toBeInTheDocument();
  });

  it('creates a key and reveals the secret once', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/saas/keys', { user: 'admin' });
    await userEvent.click(await screen.findByRole('button', { name: /create key/i }, opts));
    await userEvent.type(await screen.findByLabelText(/name/i), 'Search indexer');
    await userEvent.click(screen.getByRole('button', { name: 'Create key' }));
    await waitFor(
      () =>
        expect(
          screen.getByRole('heading', { name: /copy your new secret key/i }),
        ).toBeInTheDocument(),
      opts,
    );
  });

  it('shows the request logs', { timeout: 30_000 }, async () => {
    await renderApp('/saas/logs', { user: 'admin' });
    expect(await screen.findByRole('table', { name: 'Logs' }, opts)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(/ms$/).length).toBeGreaterThan(5), opts);
  });

  it('lists customers and opens a customer detail', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/saas/customers', { user: 'admin' });
    const table = await screen.findByRole('table', { name: 'Customers' }, opts);
    await waitFor(
      () => expect(within(table).getAllByRole('link').length).toBeGreaterThan(10),
      opts,
    );
    await userEvent.click(within(table).getByRole('link', { name: 'Globex' }));
    expect(await screen.findByRole('heading', { name: 'Admin actions' }, opts)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'API requests' })).toBeInTheDocument();
  });

  it('shows feature flags with environment toggles', { timeout: 30_000 }, async () => {
    await renderApp('/saas/flags', { user: 'admin' });
    expect(await screen.findByText('edge-cache-v2', undefined, opts)).toBeInTheDocument();
    expect(screen.getAllByRole('switch').length).toBe(24);
    expect(
      screen.getByRole('slider', { name: /rollout for new-billing-page/i }),
    ).toBeInTheDocument();
  });

  it('filters the audit log and opens the raw event', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/saas/audit', { user: 'admin' });
    const table = await screen.findByRole('table', { name: 'Audit log' }, opts);
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(10), opts);
    await userEvent.click(screen.getByRole('button', { name: 'API keys' }));
    const rows = within(table).getAllByRole('row').slice(1);
    rows.forEach((row) => expect(row).toHaveTextContent(/api_key\./));
    await userEvent.click(rows[0]!);
    expect(await screen.findByText('event.json', undefined, opts)).toBeInTheDocument();
  });

  it('shows component status and declares an incident', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/saas/status', { user: 'admin' });
    expect(
      await screen.findByText('Elevated webhook delivery latency', undefined, opts),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Declare incident' }));
    await userEvent.type(await screen.findByLabelText(/title/i), 'Search API timeouts');
    await userEvent.click(screen.getByRole('checkbox', { name: 'REST API' }));
    await userEvent.type(
      screen.getByLabelText(/first update/i),
      'Search requests time out in sin1.',
    );
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Declare incident' }),
    );
    expect(await screen.findByText('Search API timeouts', undefined, opts)).toBeInTheDocument();
  });

  it('filters integrations and opens the config sheet', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/saas/integrations', { user: 'admin' });
    expect(await screen.findByText('Stripe', undefined, opts)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Payments' }));
    expect(screen.queryByText('Slack')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Connect Stripe' }));
    expect(
      await screen.findByLabelText(/account or workspace/i, undefined, opts),
    ).toBeInTheDocument();
  });

  it('shows the permission matrix and duplicates a role', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/saas/roles', { user: 'admin' });
    await userEvent.click(await screen.findByRole('button', { name: /9 members/ }, opts));
    const matrix = await screen.findByRole('table', { name: 'Permissions for Developer' }, opts);
    expect(within(matrix).getByRole('checkbox', { name: 'Delete Webhooks' })).toBeChecked();
    expect(within(matrix).getByRole('checkbox', { name: 'Delete Billing' })).not.toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    expect(
      await screen.findByDisplayValue('Developer (copy)', undefined, opts),
    ).toBeInTheDocument();
  });

  it('filters support tickets from the URL and opens a thread', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/saas/support?status=pending', { user: 'admin' });
    const table = await screen.findByRole('table', { name: 'Support inbox' }, opts);
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(1), opts);
    const rows = within(table).getAllByRole('row').slice(1);
    rows.forEach((row) => expect(row).toHaveTextContent('Pending'));
    await userEvent.click(rows[0]!);
    expect(await screen.findByRole('button', { name: 'Send reply' }, opts)).toBeInTheDocument();
  });
});
