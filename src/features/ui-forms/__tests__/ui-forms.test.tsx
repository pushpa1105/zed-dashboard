import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

// Pages are lazy chunks with many inputs; the first transform can take a few seconds.
const SLOW = { timeout: 15_000 };

describe('ui-forms showcase', { timeout: 30_000 }, () => {
  it('renders the forms page and validates the company form', async () => {
    const { userEvent } = await renderApp('/app/ui/forms', { user: 'admin' });
    expect(
      await screen.findByRole('heading', { name: 'Company profile' }, SLOW),
    ).toBeInTheDocument();

    // Editing a field reveals the save bar; submitting shows schema errors.
    const name = screen.getByLabelText(/company name/i);
    const form = within(name.closest('form')!);
    await userEvent.type(name, 'A');
    await userEvent.click(screen.getByRole('button', { name: /save profile/i }));
    expect(await form.findByText('Use at least 2 characters')).toBeInTheDocument();
    expect(form.getByText('Pick at least one team')).toBeInTheDocument();
  });

  it('searches people through the mock API', async () => {
    const { userEvent } = await renderApp('/app/ui/selects', { user: 'admin' });
    const input = await screen.findByPlaceholderText(/search people/i, {}, SLOW);
    await userEvent.type(input, 'hannah');
    const list = await screen.findByRole('listbox');
    await waitFor(() => expect(within(list).getAllByRole('option').length).toBeGreaterThan(0));
    expect(within(list).getAllByRole('option')[0]).toHaveTextContent(/hannah/i);
  });

  it('renders the overlays page and opens a dialog', async () => {
    const { userEvent } = await renderApp('/app/ui/overlays', { user: 'admin' });
    await userEvent.click(await screen.findByRole('button', { name: 'Basic' }, SLOW));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Your export is ready');
  });
});
