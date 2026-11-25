import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

const slow = { timeout: 15_000 };

describe('Calendar app', () => {
  it(
    'renders the week with recurring events and creates a new event',
    { timeout: 40_000 },
    async () => {
      const { userEvent } = await renderApp('/app/calendar', { user: 'admin' });

      expect(await screen.findByRole('heading', { name: 'Calendar' }, slow)).toBeInTheDocument();
      // The weekday standup recurs on every weekday of the week view.
      await waitFor(
        () => expect(screen.getAllByText('Product standup').length).toBeGreaterThanOrEqual(5),
        slow,
      );

      await userEvent.click(screen.getByRole('button', { name: /new event/i }));
      const dialog = await screen.findByRole('dialog');
      await userEvent.type(within(dialog).getByLabelText('Title'), 'Pricing review');
      await userEvent.click(within(dialog).getByRole('button', { name: /create event/i }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), slow);
      // Shows in the time grid (and in Up next when it's still ahead today).
      expect(
        (await screen.findAllByText('Pricing review', undefined, slow)).length,
      ).toBeGreaterThan(0);
    },
  );

  it('switches to the agenda view', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/app/calendar', { user: 'admin' });

    await userEvent.click(await screen.findByRole('radio', { name: 'Agenda' }, slow));
    expect(await screen.findByText('Today', { selector: 'h3 span' }, slow)).toBeInTheDocument();
  });
});
