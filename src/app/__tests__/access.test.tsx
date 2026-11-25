import { HOME_AFTER_LOGIN } from '@/core/config/routes';
import { renderApp, screen, waitFor } from '@/testing/test-utils';

/** Real menu links only (the breadcrumb's current page also has role=link, without href). */
const menuLinks = (name: string) =>
  screen.queryAllByRole('link', { name }).filter((link) => link.hasAttribute('href'));

describe('access control', () => {
  it('redirects signed-out users to sign in', async () => {
    const { router } = await renderApp('/app/dashboard');
    expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe('?redirectTo=%2Fapp%2Fdashboard');
  });

  it('redirects signed-in users away from guest pages', async () => {
    const { router } = await renderApp('/login', { user: 'admin' });
    await waitFor(() => expect(router.state.location.pathname).toBe(HOME_AFTER_LOGIN.href()));
  });

  it('shows admin-only navigation and pages to admins', async () => {
    await renderApp('/app/users', { user: 'admin' });
    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(menuLinks('Users')).not.toHaveLength(0);
  });

  it('hides admin-only navigation and blocks the page for members', async () => {
    await renderApp('/app/users', { user: 'member' });
    expect((await screen.findAllByText(/you don't have access/i)).length).toBeGreaterThan(0);
    expect(menuLinks('Users')).toHaveLength(0);
  });
});
