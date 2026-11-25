import { renderApp, screen } from '@/testing/test-utils';

describe('Files app', () => {
  it('browses into a folder', { timeout: 30_000 }, async () => {
    const { userEvent, router } = await renderApp('/app/files', { user: 'admin' });

    const folder = await screen.findByTitle('Finance', {}, { timeout: 15_000 });
    await userEvent.click(folder);

    expect(
      await screen.findByText('Monthly reports', { selector: 'p' }, { timeout: 10_000 }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toBe('?folder=finance');
  });
});
