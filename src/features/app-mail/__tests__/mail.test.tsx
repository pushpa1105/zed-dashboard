import { renderApp, screen, waitFor } from '@/testing/test-utils';

describe('Mail app', () => {
  it('shows the inbox and opens a message', { timeout: 30_000 }, async () => {
    const { userEvent } = await renderApp('/app/mail', { user: 'admin' });

    await screen.findByText('Billing v3 designs ready for review', {}, { timeout: 15_000 });
    // Under a loaded test run the list can re-render mid-click; retry until the reader opens.
    await waitFor(
      async () => {
        await userEvent.click(screen.getByText('Billing v3 designs ready for review'));
        expect(screen.getByRole('button', { name: /reply/i })).toBeInTheDocument();
      },
      { timeout: 15_000 },
    );
    expect(await screen.findAllByText(/annual toggle now sits above the cards/)).not.toHaveLength(
      0,
    );
  });

  it('filters by label through the URL', { timeout: 30_000 }, async () => {
    await renderApp('/app/mail?label=travel', { user: 'admin' });

    expect(
      await screen.findByText(/Booking confirmation LH 1172/, {}, { timeout: 15_000 }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Billing v3 designs ready for review')).not.toBeInTheDocument();
  });
});
