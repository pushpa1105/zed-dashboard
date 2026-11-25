import { act, renderApp, screen } from '@/testing/test-utils';

import { i18n } from '../i18n';

describe('lazy translations', () => {
  afterEach(() => act(() => void i18n.changeLanguage('en')));

  it('fetches a language that is not bundled when the user switches to it', async () => {
    await renderApp('/app/tasks', { user: 'admin' });
    expect(await screen.findByRole('heading', { name: 'Tasks' })).toBeInTheDocument();

    await act(() => i18n.changeLanguage('es'));

    expect(await screen.findByRole('heading', { name: 'Tareas' })).toBeInTheDocument();
  });
});
