import { renderApp, screen, waitFor } from '@/testing/test-utils';

const slow = { timeout: 60_000 };
const find = { timeout: 30_000 };

describe('Academy workspace', () => {
  it('shows the learner dashboard', slow, async () => {
    await renderApp('/academy', { user: 'admin' });
    expect(await screen.findByText('Continue learning', undefined, find)).toBeInTheDocument();
  });

  it('filters the catalog by level', slow, async () => {
    const { userEvent } = await renderApp('/academy/courses', { user: 'admin' });
    expect(
      await screen.findByText('Designing Data-Intensive Dashboards', undefined, find),
    ).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('checkbox', { name: /advanced/i })[0]!);
    await waitFor(
      () =>
        expect(screen.queryByText('Designing Data-Intensive Dashboards')).not.toBeInTheDocument(),
      find,
    );
    expect(screen.getByText('React Performance in Practice')).toBeInTheDocument();
  });

  it('opens a course with its curriculum', slow, async () => {
    await renderApp('/academy/courses/sql-for-product-analytics', { user: 'admin' });
    expect(
      await screen.findByRole('heading', { name: 'SQL for Product Analytics' }, find),
    ).toBeInTheDocument();
    expect(screen.getByText('Curriculum')).toBeInTheDocument();
  });

  it('plays a lesson with its transcript', slow, async () => {
    await renderApp(
      '/academy/courses/data-intensive-dashboards/lessons/data-intensive-dashboards-m1-l1',
      { user: 'admin' },
    );
    expect(
      await screen.findByRole('heading', { name: 'Why most dashboards go unused' }, find),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Play' }).length).toBeGreaterThan(0);
  });

  it('lists assignments and opens the grading view', slow, async () => {
    const { userEvent } = await renderApp('/academy/assignments', { user: 'admin' });
    await userEvent.click(
      await screen.findByRole('link', { name: 'Redesign a cluttered report' }, find),
    );
    expect(await screen.findByText('Grade submission', undefined, find)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save grade' })).toBeInTheDocument();
  });

  it('takes a quiz and reviews the answers', slow, async () => {
    const { userEvent } = await renderApp('/academy/courses/sql-for-product-analytics/quiz', {
      user: 'admin',
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Start quiz' }, find));
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: /HAVING/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Go to question 5' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit answers' }));
    expect(await screen.findByText('Review your answers', undefined, find)).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('filters discussions and opens a thread', slow, async () => {
    const { userEvent } = await renderApp('/academy/discussions', { user: 'admin' });
    await screen.findByRole('link', { name: 'How many KPIs belong above the fold?' }, find);
    await userEvent.click(screen.getByRole('button', { name: /My threads/ }));
    await waitFor(
      () =>
        expect(
          screen.queryByRole('link', { name: 'How many KPIs belong above the fold?' }),
        ).not.toBeInTheDocument(),
      find,
    );
    await userEvent.click(
      screen.getByRole('link', { name: 'Funnel counts differ from our analytics tool' }),
    );
    expect(await screen.findByLabelText('Your reply', undefined, find)).toBeInTheDocument();
  });

  it('shows a student profile', slow, async () => {
    await renderApp('/academy/students/st-1', { user: 'admin' });
    expect(await screen.findByRole('heading', { name: 'Ava Patel' }, find)).toBeInTheDocument();
    expect(screen.getByText('Enrolled courses')).toBeInTheDocument();
  });

  it('adds a lesson in the course builder', slow, async () => {
    const { userEvent } = await renderApp('/academy/courses/sql-for-product-analytics/builder', {
      user: 'admin',
    });
    expect(await screen.findByText('Querying events', undefined, find)).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Add lesson' })[0]!);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Use at least 3 characters')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Title/), 'Joins without tears');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Joins without tears', undefined, find)).toBeInTheDocument();
  });

  it('lists live sessions and switches to past ones', slow, async () => {
    const { userEvent } = await renderApp('/academy/live', { user: 'admin' });
    expect(await screen.findByText('Upcoming sessions', undefined, find)).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /Reserve spot|Cancel spot/ }).length,
    ).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: /Past/ }));
    expect((await screen.findAllByRole('button', { name: /Watch/ }, find)).length).toBeGreaterThan(
      0,
    );
  });

  it('shows reports and switches the range', slow, async () => {
    const { userEvent } = await renderApp('/academy/reports', { user: 'admin' });
    expect(await screen.findByText('Course leaderboard', undefined, find)).toBeInTheDocument();
    expect(screen.getByText('Drop-off by lesson')).toBeInTheDocument();
    await userEvent.click(screen.getByText('12 months'));
    expect(await screen.findByText('Course leaderboard', undefined, find)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export CSV/ })).toBeEnabled();
  });
});
