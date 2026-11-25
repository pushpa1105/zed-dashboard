import { renderApp, screen } from '@/testing/test-utils';

const SLOW = { timeout: 30_000 };

// input-otp (OTP template) calls document.elementFromPoint, which jsdom lacks.
beforeAll(() => {
  if (!document.elementFromPoint) document.elementFromPoint = () => null;
});

describe('Page templates', () => {
  it('shows the gallery inside the app shell', SLOW, async () => {
    await renderApp('/app/pages', { user: 'admin' });

    expect(
      await screen.findByRole('heading', { name: 'Page templates' }, { timeout: 15_000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /two-step verification/i })).toHaveAttribute(
      'href',
      '/p/auth/otp',
    );
  });

  it('switches account settings sections through the URL', SLOW, async () => {
    const { userEvent, router } = await renderApp('/app/pages/account', { user: 'admin' });

    await screen.findByRole('heading', { name: 'Account settings' }, { timeout: 15_000 });
    await userEvent.click(screen.getByRole('button', { name: 'Billing' }));

    expect(router.state.location.search).toBe('?section=billing');
    expect(await screen.findByText('Current plan')).toBeInTheDocument();
  });

  it.each(['/p/auth/split', '/p/auth/otp', '/p/404', '/p/pricing', '/p/coming-soon'])(
    'renders the public template %s',
    SLOW,
    async (url) => {
      await renderApp(url);
      expect(
        await screen.findByRole('heading', { level: 1 }, { timeout: 15_000 }),
      ).toBeInTheDocument();
    },
  );
});
