import { renderApp, screen, waitFor } from '@/testing/test-utils';

describe('Chat app', () => {
  it('lists conversations, opens one and sends a message', { timeout: 30_000 }, async () => {
    const { userEvent, router } = await renderApp('/app/chat?c=c3', { user: 'admin' });

    expect(
      await screen.findByRole('heading', { name: 'Messages' }, { timeout: 15_000 }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Datadog line/, {}, { timeout: 15_000 })).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: 'Message' });
    await userEvent.type(input, 'Checking it now{Enter}');

    expect(await screen.findByText('Checking it now', {}, { timeout: 10_000 })).toBeInTheDocument();
    await waitFor(() => expect(input).toHaveValue(''));
    expect(router.state.location.search).toBe('?c=c3');
  });
});
