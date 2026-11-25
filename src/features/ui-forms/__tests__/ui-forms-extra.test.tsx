import { renderApp, screen, within } from '@/testing/test-utils';

const SLOW = { timeout: 15_000 };

describe('ui-forms: layouts, auth and inputs', { timeout: 30_000 }, () => {
  it('validates the stacked account form', async () => {
    const { userEvent } = await renderApp('/app/ui/form-layouts', { user: 'admin' });
    const card = (await screen.findByRole('heading', { name: 'Stacked' }, SLOW)).closest(
      'section',
    )!;
    const form = within(card);
    await userEvent.clear(form.getByLabelText(/first name/i));
    await userEvent.click(form.getByRole('button', { name: /save changes/i }));
    expect(await form.findByText('Required')).toBeInTheDocument();
  });

  it('rejects a wrong one-time code from the mock API', async () => {
    const { userEvent } = await renderApp('/app/ui/auth-forms', { user: 'admin' });
    const card = (await screen.findByRole('heading', { name: 'Enter the code' }, SLOW)).closest(
      'div.rounded-2xl',
    ) as HTMLElement;
    const stage = within(card);
    const input = stage.getAllByRole('textbox')[0]!;
    await userEvent.click(input);
    await userEvent.keyboard('111111');
    expect(await stage.findByText(/not valid/i, {}, SLOW)).toBeInTheDocument();
  });

  it('renders the advanced inputs and formats masks', async () => {
    await renderApp('/app/ui/inputs', { user: 'admin' });
    expect(await screen.findByRole('heading', { name: 'Input masks' }, SLOW)).toBeInTheDocument();
    expect(screen.getByDisplayValue('(415) 555-0142')).toBeInTheDocument();
    // The rich-text toolbar renders its formatting buttons.
    expect(screen.getAllByRole('button', { name: 'Bold' }).length).toBeGreaterThan(0);
  });
});
