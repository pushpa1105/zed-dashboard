import { act, renderApp, screen, waitFor } from '@/testing/test-utils';

import { initBrand } from '../engine';
import { useBrandStore } from '../store';

describe('brand', () => {
  afterEach(() => act(() => useBrandStore.getState().reset()));

  it('renames the product in logos, the tab title and translated copy', async () => {
    initBrand();
    await renderApp('/');
    act(() => useBrandStore.getState().set({ name: 'Acme Cloud' }));

    await waitFor(() => expect(screen.getAllByText(/Acme Cloud/).length).toBeGreaterThan(1));
    expect(document.body.textContent).not.toContain('{{brand}}');
  });
});
