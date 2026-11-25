import { DEMO_USER } from '@/mocks/db';
import { renderApp, renderWithProviders, screen, waitFor } from '@/testing/test-utils';

import { SignInForm } from '../components/sign-in-form';

const submitButton = () => screen.getByRole('button', { name: /^sign in$/i });

describe('SignInForm', () => {
  it('is prefilled with the demo account while the mock API is on', async () => {
    await renderWithProviders(<SignInForm />);

    expect(screen.getByLabelText(/email/i)).toHaveValue(DEMO_USER.email);
    expect(screen.getByLabelText(/password/i)).toHaveValue(DEMO_USER.password);
  });

  it('validates the fields', async () => {
    const onSuccess = vi.fn();
    const { userEvent } = await renderWithProviders(<SignInForm onSuccess={onSuccess} />);

    await userEvent.clear(screen.getByLabelText(/email/i));
    await userEvent.click(submitButton());

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows the server error for wrong credentials', async () => {
    const { userEvent } = await renderWithProviders(<SignInForm />);

    await userEvent.clear(screen.getByLabelText(/password/i));
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password');
    await userEvent.click(submitButton());

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it('signs in and returns the user to the page they asked for', async () => {
    const { userEvent, router } = await renderApp('/app/tasks');

    // The auth guard bounced us to /login?redirectTo=/app/tasks; the form is prefilled.
    await screen.findByLabelText(/email/i);
    await userEvent.click(submitButton());

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/tasks'));
    expect(await screen.findByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
  });

  it('signs in with one click as the demo member', async () => {
    const { userEvent, router } = await renderApp('/login?redirectTo=/app/tasks');

    await userEvent.click(await screen.findByRole('button', { name: /member demo/i }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/tasks'));
  });
});
