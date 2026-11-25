import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

const T = { timeout: 15_000 };

describe('HR workspace', () => {
  it('renders the ported hiring dashboard as the workspace home', { timeout: 30_000 }, async () => {
    await renderApp('/hr', { user: 'admin' });

    expect(await screen.findByRole('heading', { name: 'Hiring & people' }, T)).toBeInTheDocument();
    expect(await screen.findByText('Upcoming interviews', {}, T)).toBeInTheDocument();
  });

  it('shows the org chart starting from the CEO', { timeout: 30_000 }, async () => {
    await renderApp('/hr/org', { user: 'admin' });

    expect(await screen.findByText('Chief Executive Officer', {}, T)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /7 reports/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('approves a pending time-off request', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/hr/time-off', { user: 'admin' });

    const queue = (await screen.findByText('Waiting for approval', {}, T)).closest('section')!;
    const approve = within(queue).getAllByRole('button', { name: /approve/i });
    const before = approve.length;
    await userEvent.click(approve[0]!);

    await waitFor(
      () =>
        expect(within(queue).queryAllByRole('button', { name: /approve/i }).length).toBe(
          before - 1,
        ),
      T,
    );
  });

  it('approves a submitted timesheet', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/hr/attendance', { user: 'admin' });

    expect(await screen.findByRole('heading', { name: 'Attendance' }, T)).toBeInTheDocument();
    const approve = await screen.findAllByRole('button', { name: /^approve timesheet for/i }, T);
    const before = approve.length;
    await userEvent.click(approve[0]!);

    await waitFor(
      () =>
        expect(screen.queryAllByRole('button', { name: /^approve timesheet for/i }).length).toBe(
          before - 1,
        ),
      T,
    );
  });

  it('ticks an onboarding task', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/hr/onboarding', { user: 'admin' });

    const task = await screen.findByRole('checkbox', { name: 'Pick an onboarding buddy' }, T);
    const wasChecked = task.getAttribute('aria-checked') === 'true';
    await userEvent.click(task);

    await waitFor(() => expect(task).toHaveAttribute('aria-checked', String(!wasChecked)), T);
  });

  it('opens a benefit plan in a sheet', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/hr/benefits', { user: 'admin' });

    await userEvent.click(await screen.findByRole('button', { name: /premium ppo/i }, T));

    const sheet = await screen.findByRole('dialog', {}, T);
    expect(within(sheet).getByText('What it covers')).toBeInTheDocument();
  });

  it('filters training assignments from the URL', { timeout: 30_000 }, async () => {
    await renderApp('/hr/training?status=overdue', { user: 'admin' });

    expect(await screen.findByText('Compliance by department', {}, T)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Overdue' })).toHaveAttribute('aria-checked', 'true');
    const table = screen.getByRole('table');
    expect(within(table).getAllByText('Overdue').length).toBeGreaterThan(0);
    expect(within(table).queryByText('Completed')).not.toBeInTheDocument();
  });

  it('shows eNPS, the score heat table and anonymous comments', { timeout: 30_000 }, async () => {
    await renderApp('/hr/engagement', { user: 'admin' });

    expect(await screen.findByText('Scores by question and department', {}, T)).toBeInTheDocument();
    expect(screen.getByText('eNPS trend')).toBeInTheDocument();
    expect(screen.getByText(/ERG events/)).toBeInTheDocument();
  });

  it('sends a signature reminder from the document sheet', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/hr/documents', { user: 'admin' });

    await userEvent.click(await screen.findByRole('button', { name: 'Code of Conduct' }, T));
    const sheet = await screen.findByRole('dialog', {}, T);
    await userEvent.click(within(sheet).getByRole('tab', { name: /history/i }));
    expect(within(sheet).getByText('Initial release', { exact: false })).toBeInTheDocument();

    await userEvent.click(within(sheet).getByRole('button', { name: 'Send reminder' }));
    expect(await within(sheet).findByRole('button', { name: 'Reminder sent' }, T)).toBeDisabled();
  });

  it('shows a candidate profile and moves them forward', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/hr/candidates/c-1', { user: 'admin' });

    expect(await screen.findByText('Interview scorecards', {}, T)).toBeInTheDocument();
    const advance = await screen.findByRole('button', { name: /^move to /i }, T);
    const label = advance.textContent;
    await userEvent.click(advance);

    await waitFor(
      () => expect(screen.getByRole('button', { name: /^move to /i }).textContent).not.toBe(label),
      T,
    );
  });
});
