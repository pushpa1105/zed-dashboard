import { renderApp, screen } from '@/testing/test-utils';

const slow = { timeout: 60_000 };
const find = { timeout: 30_000 };

describe('Analytics workspace', () => {
  it('renders the overview with KPIs inside the workspace shell', slow, async () => {
    await renderApp('/analytics', { user: 'admin' });
    expect(
      await screen.findByRole('heading', { name: 'Analytics', level: 1 }, find),
    ).toBeInTheDocument();
    expect(await screen.findByText('Total page views', undefined, find)).toBeInTheDocument();
  });

  it('shows live users on the realtime page', slow, async () => {
    await renderApp('/analytics/realtime', { user: 'admin' });
    expect(await screen.findByText('Active users right now', undefined, find)).toBeInTheDocument();
    expect(await screen.findByText('Live events', undefined, find)).toBeInTheDocument();
  });

  it('builds a funnel from the default steps', slow, async () => {
    await renderApp('/analytics/funnels?range=7d', { user: 'admin' });
    expect(await screen.findByText('Overall conversion', undefined, find)).toBeInTheDocument();
    expect(screen.getAllByText('Visited landing page').length).toBeGreaterThan(0);
  });

  it('lists saved reports', slow, async () => {
    await renderApp('/analytics/reports', { user: 'admin' });
    expect(await screen.findByText('Weekly traffic digest', undefined, find)).toBeInTheDocument();
  });
  it('shows the cohort retention table and curve', slow, async () => {
    await renderApp('/analytics/retention', { user: 'admin' });
    expect(await screen.findByText('Cohort retention', undefined, find)).toBeInTheDocument();
    expect(screen.getByText('Retention curve')).toBeInTheDocument();
    expect(screen.getByText('Weighted average')).toBeInTheDocument();
  });

  it('lists events and opens the property breakdown', slow, async () => {
    const { userEvent } = await renderApp('/analytics/events', { user: 'admin' });
    await userEvent.click(await screen.findByRole('button', { name: /Purchase completed/ }, find));
    expect(await screen.findByText('Property breakdown', undefined, find)).toBeInTheDocument();
  });

  it('lists goals with their progress', slow, async () => {
    await renderApp('/analytics/goals', { user: 'admin' });
    expect(await screen.findByText('Trial starts', undefined, find)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New goal' })).toBeInTheDocument();
  });

  it('links experiments to their detail page', slow, async () => {
    await renderApp('/analytics/experiments', { user: 'admin' });
    const link = await screen.findByRole('link', { name: 'Outcome-focused hero headline' }, find);
    expect(link).toHaveAttribute('href', '/analytics/experiments/hero-headline');
  });

  it('ranks countries and opens the country sheet', slow, async () => {
    const { userEvent } = await renderApp('/analytics/geography', { user: 'admin' });
    await userEvent.click(await screen.findByRole('button', { name: 'Open Germany' }, find));
    expect(await screen.findByText('Daily sessions', undefined, find)).toBeInTheDocument();
  });

  it('breaks down devices and conversion by segment', slow, async () => {
    const { userEvent } = await renderApp('/analytics/technology', { user: 'admin' });
    expect(await screen.findByText('Conversion by segment', undefined, find)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Resolution' }));
    expect(screen.getByText('1920×1080')).toBeInTheDocument();
  });

  it('lists open alerts and alert rules', slow, async () => {
    await renderApp('/analytics/alerts', { user: 'admin' });
    expect(await screen.findByText('Traffic drop', undefined, find)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Acknowledge' }).length).toBeGreaterThan(0);
  });

  it('compares variants on the experiment detail page', slow, async () => {
    await renderApp('/analytics/experiments/hero-headline', { user: 'admin' });
    expect(await screen.findByText('Social proof headline', undefined, find)).toBeInTheDocument();
    expect(screen.getByText(/beats the control/)).toBeInTheDocument();
  });
});
