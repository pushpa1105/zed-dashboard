import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

const slow = { timeout: 15_000 };

describe('Kanban app', () => {
  it(
    'renders the board columns with WIP counters and adds a card',
    { timeout: 40_000 },
    async () => {
      const { userEvent } = await renderApp('/app/kanban', { user: 'admin' });

      const todo = await screen.findByRole('region', { name: 'To do' }, slow);
      expect(screen.getByRole('region', { name: 'In progress' })).toBeInTheDocument();
      // "In review" is over its WIP limit of 2.
      expect(
        within(screen.getByRole('region', { name: 'In review' })).getByText('3 / 2'),
      ).toBeInTheDocument();

      await userEvent.click(within(todo).getByRole('button', { name: /add a card/i }));
      await userEvent.type(within(todo).getByRole('textbox'), 'Write the launch blog post{Enter}');

      expect(
        await within(todo).findByText('Write the launch blog post', undefined, slow),
      ).toBeInTheDocument();
    },
  );

  it('opens a card and filters by label', { timeout: 40_000 }, async () => {
    const { userEvent } = await renderApp('/app/kanban', { user: 'admin' });

    await userEvent.click(await screen.findByText('Schedule editor UI', undefined, slow));
    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByText('Checklist')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /labels/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Bug', pressed: false }));
    await waitFor(
      () => expect(screen.queryByText('Schedule editor UI')).not.toBeInTheDocument(),
      slow,
    );
    expect(screen.getByText('PDF renderer: page breaks inside tables')).toBeInTheDocument();
  });
});
