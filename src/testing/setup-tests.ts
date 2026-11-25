import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, configure } from '@testing-library/react';

import '@/app/i18n';

import { resetDb } from '@/mocks/db';
import { server } from '@/mocks/server';

// Register jest-dom matchers on Vitest's expect explicitly (robust across module instances).
expect.extend(matchers);

// Pages are lazy chunks and the suite runs many workers in parallel: give async
// queries (findBy*, waitFor) more headroom than the 1s default.
configure({ asyncUtilTimeout: 5000 });

// ---- jsdom polyfills required by Radix UI / shadcn ------------------------
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Element.prototype.scrollIntoView = () => {};

// input-otp polls the element under its caret; jsdom has no layout, so nothing is there.
if (!document.elementFromPoint) document.elementFromPoint = () => null;

// The signature pad draws on a canvas; jsdom has no 2D context. Return null quietly
// instead of logging "Not implemented" (the component treats null as "can't draw").
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
Element.prototype.hasPointerCapture = () => false;
Element.prototype.releasePointerCapture = () => {};

// ---- MSW --------------------------------------------------------------------
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterAll(() => server.close());

beforeEach(() => {
  resetDb();
  window.localStorage.clear();
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});
